import React from 'react'
import axios from 'utils/axios'
import get from 'lodash/get'
import noop from 'lodash/noop'
import pickBy from 'lodash/pickBy'
import isEmpty from 'lodash/isEmpty'
import isPast from 'date-fns/isPast'
import {useMachine} from '@xstate/react'
import {createMachine, assign} from 'xstate'
import {SellableResource, Price} from '@types'
import queryString from 'query-string'
import {isBrowser} from 'utils/is-browser'

// /pure loads stripe on the first call (is someone makes a purchase)
import {loadStripe} from '@stripe/stripe-js/pure'
import {useViewer} from 'contexts/viewer-context'
// TODO: set purchase key
const PURCHASE_KEY = 'sr_purchase'

const storePurchase = (purchase: any) => {
  try {
    localStorage.setItem(PURCHASE_KEY, JSON.stringify(purchase))
  } catch (error) {
    console.log(error)
  }
}

// TODO: set convertkit tags for after purchase
export const signupAfterPurchase = (
  title: string,
  email: string,
  purchase: any,
) => {
  const api_key = process.env.NEXT_PUBLIC_CONVERTKIT_PUBLIC_KEY
  const form = process.env.NEXT_PUBLIC_CONVERTKIT_SIGNUP_FORM
  const bulkTag = 1888676

  const tagHash = {
    purchased: 12345,
  }

  const tags = [tagHash.purchased]

  if (purchase.quantity > 1) {
    tags.push(bulkTag)
  }

  return axios({
    method: 'post',
    url: `https://api.convertkit.com/v3/forms/${form}/subscribe`,
    data: {
      email,
      api_key,
      tags,
    },
  }).then(() => storePurchase(purchase))
}

type CreateCommerceMachineProps = {
  sellable: SellableResource
  upgradeFromSellable?: SellableResource
}

interface CommerceMachineContext {
  sellable: SellableResource | null
  upgradeFromSellable?: SellableResource | null
  bulk: boolean
  error?: string | null
  price?: Price
  appliedCoupon?: string | null
  accessToken?: string
  notification?: string
  email?: string
  stripeToken?: string
  quantity?: number
  purchase?: {sellable: SellableResource}
  stripeCheckoutData?: any
  stripe?: any
  stripePriceId?: string
}

// This generates the params based on the presence of `stripePriceId`
// If its there, then we just need to send the id and quantity
// if not, then we send the sellable params
const getStripeCheckoutParams = (machineContext: CommerceMachineContext) => {
  const {
    quantity,
    appliedCoupon,
    sellable,
    upgradeFromSellable,
    bulk,
    stripePriceId,
  } = machineContext

  if (!sellable) {
    throw new Error('sellable is undefined')
  }

  const result = isEmpty(stripePriceId)
    ? {
        sellables: [
          {
            site: sellable.site,
            sellable_id: sellable.slug,
            sellable: sellable.type.toLowerCase(),
            bulk,
            quantity,
            upgrade_from_sellable_id: upgradeFromSellable?.slug,
            upgrade_from_sellable: upgradeFromSellable?.type,
          },
        ],
        code: appliedCoupon,
      }
    : {
        stripe_price_id: stripePriceId,
        quantity,
      }

  return pickBy(result)
}

// these are loaded from an env file so we know they are there
// this is the url we use to generate the checkout session
const stripeCheckoutSessionUrl = process.env
  .NEXT_PUBLIC_STRIPE_CHECKOUT_SESSIONS_URL!
// The URL Stripe redirects to after a successful purchase
const stripeCheckoutSessionSuccessUrl = process.env
  .NEXT_PUBLIC_STRIPE_CHECKOUT_SESSIONS_SUCCESS_URL!
// The URL Stripe redirects to after a cancelled purchase
const stripeCheckoutSessionCancelUrl = process.env
  .NEXT_PUBLIC_STRIPE_CHECKOUT_SESSIONS_CANCEL_URL!
// This is the `site` column on the `Sellable`
const siteName = process.env.NEXT_PUBLIC_SITE_NAME!
// This is the `Doorkeeper::Application#uid` we use to identify the site with
const clientId = process.env.NEXT_PUBLIC_CLIENT_ID!
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!

// This promise creates a Stripe checkout session
const checkoutSessionFetcher = (machineContext: CommerceMachineContext) => {
  const params = {
    ...getStripeCheckoutParams(machineContext),
    site: siteName,
    client_id: clientId,
    success_url: stripeCheckoutSessionSuccessUrl,
    cancel_url: stripeCheckoutSessionCancelUrl,
  }

  console.log(params)
  return axios.post(stripeCheckoutSessionUrl, params).then(({data}) => data)
}

// This creates the params to fetch the price from a Sellable or a Stripe Price
// The sellable price is fetched from egghead's api
// The Stripe Price is fetched from stripe
const getPriceParams = (machineContext: CommerceMachineContext) => {
  const {
    quantity,
    appliedCoupon,
    sellable,
    upgradeFromSellable,
    stripePriceId,
  } = machineContext

  if (!sellable) {
    throw new Error('sellable is undefined')
  }
  const {site, id: sellable_id, type} = sellable

  return isEmpty(stripePriceId)
    ? pickBy({
        sellables: [
          {
            site,
            sellable_id,
            upgrade_from_sellable_id: upgradeFromSellable?.slug,
            upgrade_from_sellable: upgradeFromSellable?.type,
            sellable: type.toLowerCase(),
            quantity,
          },
        ],
        site,
        code: appliedCoupon,
      })
    : {id: stripePriceId}
}

const priceFetcher = (machineContext: CommerceMachineContext) => {
  const {stripePriceId} = machineContext
  const params = getPriceParams(machineContext)
  return isEmpty(stripePriceId)
    ? axios
        .post(
          `${process.env.NEXT_PUBLIC_AUTH_DOMAIN}/api/v1/sellable_purchases/prices`,
          params,
        )
        .then(({data}) => data)
    : axios.get(`/api/stripe/prices`, {params}).then(({data}) => data)
}

type CommerceEvent =
  | {type: 'APPLY_COUPON'; appliedCoupon: string}
  | {type: 'DISMISS_COUPON'; appliedCoupon: null}
  | {
      type: 'SET_QUANTITY'
      quantity: number
      bulk: boolean
    }
  | {type: 'START_PURCHASE'}
  | {type: 'CLAIM_COUPON'; email: string}
  | {type: 'START_STRIPE_CHECKOUT'}
  | {type: 'CANCEL_PURCHASE'}
  | {type: 'HANDLE_PURCHASE'; email: string; stripeToken: string}

const commerceMachine = createMachine<CommerceMachineContext, CommerceEvent>(
  {
    id: 'commerceMachine',
    initial: 'checkingCoupon',
    context: {
      sellable: null,
      upgradeFromSellable: null,
      bulk: false,
      quantity: 1,
    },
    states: {
      checkingCoupon: {
        always: [{target: 'fetchingPrice', actions: 'checkForCouponInHeader'}],
      },
      fetchingPrice: {
        invoke: {
          id: 'fetchPrice',
          src: 'priceFetcher',
          onDone: {
            target: 'checkingPriceData',
            actions: [
              assign({
                price: (context, event) => event.data[0],
              }),
              'adjustPriceForUpgrade',
            ],
          },
          onError: {
            target: 'failure',
            actions: assign({error: (context, event) => event.data}),
          },
        },
      },
      checkingPriceData: {
        always: [
          {
            target: 'failure',
            cond: 'couponErrorIsPresent',
            actions: ['setErrorFromCoupon'],
          },
          {target: 'priceLoaded', actions: ['checkForDefaultCoupon']},
        ],
      },
      priceLoaded: {
        on: {
          APPLY_COUPON: {
            target: 'fetchingPrice',
            actions: [
              assign({
                appliedCoupon: (context, event) => event.appliedCoupon,
              }),
            ],
          },
          DISMISS_COUPON: {
            target: 'fetchingPrice',
            actions: ['clearAppliedCoupon'],
          },
          SET_QUANTITY: {
            target: 'fetchingPrice',
            actions: [
              assign({
                quantity: (context, event) => event.quantity,
                bulk: (context, event) => event.bulk,
              }),
              'clearAppliedCoupon',
            ],
          },
          START_PURCHASE: {
            target: 'stripePurchase',
          },
          CLAIM_COUPON: {
            target: 'handlePurchase',
            actions: [
              assign({
                email: (context, event) => event.email,
              }),
            ],
          },
          START_STRIPE_CHECKOUT: {target: 'loadingStripeCheckoutSession'},
        },
      },
      loadingStripeCheckoutSession: {
        invoke: {
          id: 'createStripeCheckoutSession',
          src: 'checkoutSessionFetcher',
          onDone: {
            target: 'success',
            actions: [
              assign({
                stripeCheckoutData: (context, event) => event.data,
              }),
              'sendToCheckout',
            ],
          },
          onError: {
            target: 'failure',
            actions: assign({
              error: (context, event) => {
                return (
                  event?.data?.response?.data?.error ||
                  `Purchase failed. Please contact ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL} for help`
                )
              },
            }),
          },
        },
      },
      stripePurchase: {
        on: {
          CANCEL_PURCHASE: {
            target: 'priceLoaded',
          },
          HANDLE_PURCHASE: {
            target: 'handlePurchase',
            actions: [
              assign({
                email: (context, event) => event.email,
                stripeToken: (context, event) => event.stripeToken,
              }),
            ],
          },
        },
      },
      // add upgrading state
      handlePurchase: {
        invoke: {
          id: 'handlePurchase',
          src: (context, event) => {
            const {
              quantity,
              appliedCoupon,
              sellable,
              stripeToken,
              email,
              upgradeFromSellable,
              bulk,
            } = context

            if (!sellable) {
              throw new Error('sellable is undefined')
            }
            const {id: sellable_id, type} = sellable
            if (process.env.NEXT_PUBLIC_AUTH_DOMAIN) {
              return axios
                .post(
                  `${process.env.NEXT_PUBLIC_AUTH_DOMAIN}/api/v1/sellable_purchases`,
                  pickBy({
                    site: process.env.NEXT_PUBLIC_SITE_NAME,
                    sellable_id,
                    sellable: type.toLowerCase(),
                    quantity,
                    stripeToken,
                    client_id: process.env.NEXT_PUBLIC_CLIENT_ID,
                    code: appliedCoupon,
                    email,
                    bulk,
                    upgrade_from_sellable_id: upgradeFromSellable?.slug,
                    upgrade_from_sellable: upgradeFromSellable?.type,
                  }),
                )
                .then(({data}) => data)
            } else {
              return Promise.reject(
                'process.env.NEXT_PUBLIC_AUTH_DOMAIN is not set up',
              )
            }
          },
          onDone: {
            target: 'success',
            actions: [
              assign({
                purchase: (context, event) => event.data,
              }),
              'sendToThanks',
            ],
          },
          onError: {
            target: 'failure',
            actions: assign({
              error: (context, event) => {
                return (
                  event?.data?.response?.data?.error ||
                  `Purchase failed. Please contact ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL} for help`
                )
              },
            }),
          },
        },
      },
      success: {},
      failure: {
        on: {
          START_PURCHASE: {
            target: 'stripePurchase',
            actions: ['clearError'],
          },
        },
      },
    },
  },
  {
    services: {
      priceFetcher,
      checkoutSessionFetcher,
    },
    guards: {
      couponErrorIsPresent: (context, event) => {
        return !!context?.price?.coupon_error
      },
    },
    actions: {
      clearError: assign({error: (context, event) => null}),
      clearAppliedCoupon: assign({
        appliedCoupon: (context, event) => null,
      }),
      adjustPriceForUpgrade: assign({
        price: (context, event) => {
          const {upgradeFromSellable, price, quantity} = context
          if (isEmpty(upgradeFromSellable)) {
            return price
          }
          if (quantity && quantity > 1) {
            return price
          }
          if (price && upgradeFromSellable) {
            return {
              ...price,
              price: price.price - upgradeFromSellable.price,
            }
          }
        },
      }),
      setErrorFromCoupon: assign({
        error: (context, event) => context.price && context.price.price_message,
      }),
      sendToThanks: (context, event) => {
        const {email, purchase, upgradeFromSellable} = context
        if (purchase && email) {
          signupAfterPurchase(
            purchase.sellable.title,
            email,
            purchase.sellable,
          ).finally(() => {
            window.scroll(0, 0)
            window.location.href = `/thanks?email=${encodeURIComponent(
              email,
            )}&upgrade=${!isEmpty(upgradeFromSellable)}`
          })
        }
      },
      sendToCheckout: async (context, event) => {
        console.log(stripePublicKey)
        const stripe = await loadStripe(stripePublicKey)
        if (stripe) {
          const {stripeCheckoutData} = context

          stripe.redirectToCheckout({
            sessionId: stripeCheckoutData.id,
          })
        }
      },
      checkForDefaultCoupon: assign({
        appliedCoupon: (context, event) => {
          const quantity = get(context, 'quantity')
          if (quantity !== 1) {
            return null
          }

          const existingAppliedCoupon = get(context, 'appliedCoupon')
          if (!isEmpty(existingAppliedCoupon)) {
            return existingAppliedCoupon
          }

          const defaultCoupon = get(context, 'price.coupon')
          const getDateFromUtc = (utc: number) => {
            let d = new Date(0)
            d.setUTCSeconds(utc)
            return d
          }

          if (
            !isEmpty(defaultCoupon) &&
            !isPast(getDateFromUtc(get(defaultCoupon, 'coupon_expires_at')))
          ) {
            return get(defaultCoupon, 'coupon_code')
          } else {
            return null
          }
        },
      }),
      checkForCouponInHeader: assign({
        appliedCoupon: (context, event) => {
          try {
            const searchQuery =
              isBrowser() && queryString.parse(window.location.search)
            return get(searchQuery, 'coupon')
          } catch (e) {
            console.error({e})
            return null
          }
        },
      }),
    },
  },
)

const createCommerceMachine = ({
  sellable,
  upgradeFromSellable,
}: CreateCommerceMachineProps) =>
  commerceMachine.withContext({
    sellable,
    upgradeFromSellable,
    bulk: false,
    quantity: 1,
  })

type UseCommerceMachineProps = {
  sellable: SellableResource
  upgradeFromSellable?: SellableResource
}

export const useCommerceMachine = ({
  sellable,
  upgradeFromSellable,
}: UseCommerceMachineProps) => {
  const sellableSlug = get(sellable, 'slug')
  const commerceMachine = React.useMemo(() => {
    return createCommerceMachine({
      sellable,
      upgradeFromSellable,
    })
  }, [sellableSlug, upgradeFromSellable])

  return useMachine(commerceMachine)
}
