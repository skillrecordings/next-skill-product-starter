import React from 'react'
import {SellableResource, Price, Coupon} from '@types'
import Countdown from 'components/commerce/countdown'
import ParityCouponMessage from 'components/commerce/parity-coupon-message'
import StripeCheckout, {StripeCheckoutProps} from 'react-stripe-checkout'
import {useCommerceMachine} from 'hooks/use-commerce-machine'
import {useViewer} from 'contexts/viewer-context'
import {motion} from 'framer-motion'
import {isEmpty, get, find, noop} from 'lodash'
import Spinner from 'components/spinner'

type PurchaseButtonProps = {
  purchasing?: boolean
  children?: string
  bundle: SellableResource
  isProPackage: boolean
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

// problem with `react-stripe-checkout` not having these types
// https://github.com/azmenak/react-stripe-checkout/pull/152
interface StripeCheckoutPropsExtended extends StripeCheckoutProps {
  children: any
  opened?: (this: StripeCheckoutProps, ...args: any[]) => void
  closed?: (this: StripeCheckoutProps, ...args: any[]) => void
}

const StripeCheckoutExtended = ({
  token,
  stripeKey,
  ...rest
}: StripeCheckoutPropsExtended) => (
  <StripeCheckout token={token} stripeKey={stripeKey} {...rest} />
)

const PurchaseButton = ({
  purchasing,
  children,
  bundle,
  onClick,
  isProPackage,
}: PurchaseButtonProps) => {
  const purchasingStyles = 'opacity-50 cursor-default'
  return (
    <button
      className={`${
        purchasing ? purchasingStyles : ''
      } flex text-center justify-center px-5 py-4 ${
        isProPackage
          ? 'bg-gradient-to-t from-blue-600 to-blue-500 text-white'
          : 'sm:border-2 sm:border-blue-500 sm:text-blue-600 dark:sm:text-white sm:from-white sm:to-white dark:sm:from-gray-900 dark:sm:to-gray-900 bg-gradient-to-t from-blue-600 to-blue-500 dark:hover:from-blue-600 dark:hover:to-blue-500 text-white hover:from-blue-600 hover:to-blue-500 hover:text-white'
      } hover:shadow-xl transform hover:scale-105 dark:bg-white  rounded-lg w-full font-bold text-lg transition-all ease-in-out duration-200 focus:scale-100`}
      aria-describedby={`${bundle.title} Tier`}
      onClick={onClick}
    >
      {purchasing ? <Spinner /> : children}
    </button>
  )
}

const dollarsToCents = (dollars: number | string) =>
  typeof dollars === 'string' ? 0 : dollars * 100

type PurchaseBundleProps = {
  bundle: SellableResource
  upgradeFromSellable?: SellableResource
  purchasingOtherPackage?: boolean
  setPurchasingPackage?: (bundleSlug?: string) => void
  stripeCheckoutV1Enabled?: boolean
}
const PurchaseBundle = ({
  bundle,
  upgradeFromSellable,
  purchasingOtherPackage = false,
  setPurchasingPackage = noop,
  stripeCheckoutV1Enabled = false,
}: PurchaseBundleProps) => {
  const [state, send] = useCommerceMachine({
    sellable: bundle,
    upgradeFromSellable,
  })
  const {viewer} = useViewer()
  const [planType, setPlanType] = React.useState<'individual' | 'team'>(
    'individual',
  )
  const [isPPP, setIsPPP] = React.useState(false)
  // const {subscriber} = useConvertkit()
  const isProPackage = bundle.title === 'Pure React Pro'

  const isPurchasing =
    state.matches('stripePurchase') ||
    state.matches('handlePurchase') ||
    state.matches('success')
  const bundleSlug = bundle.slug

  React.useEffect(() => {
    if (isPurchasing) {
      setPurchasingPackage(bundleSlug)
    } else {
      setPurchasingPackage()
    }
  }, [isPurchasing, bundleSlug, setPurchasingPackage])

  // React.useEffect(() => {
  //   if (
  //     teamAvailable &&
  //     subscriber?.fields?.job_title === 'manager' &&
  //     planType != 'team'
  //   ) {
  //     activateTeamPlan()
  //   }
  //   // don't want this to update until a subscriber loads and not again after that
  // }, [subscriber])

  if (isEmpty(bundle)) {
    return null
  }

  const availableCoupons = state?.context?.price?.available_coupons || []
  const parityCoupon = find(availableCoupons, {
    coupon_region_restricted: true,
  }) as Coupon
  const countryCode = get(parityCoupon, 'coupon_region_restricted_to')
  const countryName = get(parityCoupon, 'coupon_region_restricted_to_name')
  const displayParityCouponOffer =
    !(isEmpty(countryName) || isEmpty(countryCode) || isEmpty(parityCoupon)) ||
    (state.context.quantity && state.context.quantity > 1)

  const onApplyParityCoupon = () => {
    setIsPPP(true)
    send('APPLY_COUPON', {appliedCoupon: parityCoupon.coupon_code})
  }

  const onDismissParityCoupon = () => {
    setIsPPP(false)
    send('DISMISS_COUPON')
  }

  const setQuantity = ({quantity, bulk}: {quantity: number; bulk: boolean}) => {
    send('SET_QUANTITY', {quantity, bulk})
  }

  const setTeamQuantity = ({quantity}: {quantity: number}) => {
    setQuantity({quantity, bulk: true})
  }

  const activateIndividualPlan = () => {
    setQuantity({quantity: 1, bulk: false})
    setPlanType('individual')
  }

  const activateTeamPlan = () => {
    setTeamQuantity({quantity: 5})
    setPlanType('team')
    setIsPPP(false)
  }

  const createStripeSession = () => {
    send('START_STRIPE_CHECKOUT')
  }

  const onStripeToken = ({id, email}: {id: string; email: string}) => {
    send('HANDLE_PURCHASE', {stripeToken: id, email})
  }

  const onOpenStripePurchase = () => {
    send('START_PURCHASE')
  }

  const onCloseStripePurchase = () => {
    send('CANCEL_PURCHASE')
  }

  const currentPrice = state.context?.price?.price
  const fullPrice = state.context?.price?.full_price
  const displayPrice = currentPrice ? currentPrice : '--'
  const displayFullPrice = fullPrice ? fullPrice : '--'

  const getPercentOff = ({
    price,
    quantity,
  }: {
    price?: Price
    quantity?: number
  }) => {
    if (!price) return
    if (isEmpty(price.bulk_discount) && isEmpty(price.coupon)) {
      return
    }
    const fractionOff =
      quantity === 1
        ? Number(price.coupon.coupon_discount)
        : Number(price.bulk_discount)

    if (fractionOff) {
      return fractionOff * 100
    }
  }

  const displayPercentOff = getPercentOff({
    price: state.context.price,
    quantity: state.context.quantity,
  })

  const expiresAt =
    Number(state.context?.price?.coupon?.coupon_expires_at) * 1000 || false

  const getPurchaseButtonText = () => {
    if (state.matches('purchasing')) {
      return 'Purchasing...'
    } else if (planType === 'team') {
      return 'Level Up Your Team'
    } else if (isProPackage) {
      return 'Invest In Your Career'
    } else {
      return 'Invest In Your Career'
    }
  }

  const disablePurchaseButton =
    state.matches('handlePurchase') ||
    state.matches('success') ||
    state.matches('loadingStripeCheckoutSession') ||
    purchasingOtherPackage

  const teamAvailable = isEmpty(upgradeFromSellable)

  return (
    <>
      <div className="pb-5">
        <div>
          <h3
            className={`text-center md:text-2xl text-2xl leading-tight font-bold`}
            id={`tier-${bundle.title}`}
          >
            {bundle.title}
          </h3>
          <h4 className="text-center text-blue-500 dark:text-blue-400 pb-5">
            {bundle.description || '21 chapters of React knowledge'}
          </h4>
          {state.context.error && (
            <div className="w-full bg-red-100 dark:bg-red-500 text-red-700 dark:text-red-100 p-4 mt-4 rounded-lg mb-4 bg-opacity-100 dark:bg-opacity-20">
              <h4 className="text-tomato-600 w-full text-center">
                🚨 There was an error processing your card.{' '}
                <strong>{state.context.error}</strong>. Please contact your
                bank. Reload the page to try another card.
              </h4>
            </div>
          )}
          {expiresAt && !isPPP && <Countdown date={expiresAt} />}
          <div className="flex items-center justify-center">
            <span className="px-3 flex items-start leading-none tracking-tight text-gray-900 sm:text-6xl">
              <span className="mt-1 mr-1 text-3xl font-medium text-gray-700 dark:text-gray-400">
                $
              </span>
              <span className="font-extrabold text-6xl text-black dark:text-white">
                {displayPrice}
              </span>
              {((state.context.quantity && state.context.quantity > 4) ||
                displayPercentOff) && (
                <div className="flex flex-col">
                  <span className="ml-2 font-medium line-through text-4xl text-black dark:text-white">
                    {typeof displayFullPrice === 'number' &&
                      displayFullPrice * (state.context.quantity || 1)}
                  </span>
                  {displayPercentOff && (
                    <span className="text-base ml-2 tracking-normal font-semibold text-green-500">
                      {`Save ${displayPercentOff}%`}
                    </span>
                  )}
                </div>
              )}
            </span>
          </div>
          <div className="mb-8 opacity-70 text-center">yours forever</div>
          {isEmpty(upgradeFromSellable) && isProPackage && (
            <motion.div
              initial={{opacity: 0, margin: '0px 0px'}}
              animate={{opacity: 1, margin: '20px 0px'}}
              exit={{opacity: 0, margin: '0px 0px'}}
              className="flex justify-center"
            >
              <div className="flex space-x-3 items-center">
                <label htmlFor="quantity" className="">
                  Quantity
                </label>
                <input
                  value={state.context.quantity}
                  onChange={(event) => {
                    const newQuantity = event.target.value
                    setTeamQuantity({quantity: Number(newQuantity)})
                  }}
                  className="form-input text-lg text-center flex font-semibold leading-tight border-gray-200 dark:border-gray-800 w-16 dark:bg-gray-900 rounded-full bg-gray-100 text-black dark:text-white"
                  name="quantity"
                  type="number"
                  min="1"
                  max="1000"
                />
              </div>
            </motion.div>
          )}
        </div>
        <div>
          <div className="rounded-lg">
            {stripeCheckoutV1Enabled && (
              <StripeCheckoutExtended
                email={get(viewer, 'email')}
                allowRememberMe={false}
                ComponentClass={'div'}
                currency={'USD'}
                locale={'en'}
                panelLabel={'Pay'}
                triggerEvent={'onClick'}
                zipCode={false}
                token={onStripeToken}
                opened={onOpenStripePurchase}
                closed={onCloseStripePurchase}
                name={bundle.title}
                description={bundle.description}
                amount={dollarsToCents(displayPrice)}
                stripeKey={process.env.NEXT_PUBLIC_STRIPE_TOKEN as string}
                image={bundle.square_cover_480_url}
              >
                <PurchaseButton isProPackage={isProPackage} bundle={bundle}>
                  {getPurchaseButtonText()}
                </PurchaseButton>
              </StripeCheckoutExtended>
            )}
            {!stripeCheckoutV1Enabled &&
              (disablePurchaseButton ? (
                <PurchaseButton
                  purchasing
                  isProPackage={isProPackage}
                  bundle={bundle}
                >
                  Navigating to checkout...
                </PurchaseButton>
              ) : (
                <PurchaseButton
                  onClick={createStripeSession}
                  isProPackage={isProPackage}
                  bundle={bundle}
                >
                  {getPurchaseButtonText()}
                </PurchaseButton>
              ))}
          </div>
        </div>
        {/* {teamAvailable && (
          <motion.div layout className="mt-10 flex justify-center w-full">
            <TeamPlanToggle
              planType={planType}
              activateIndividualPlan={activateIndividualPlan}
              activateTeamPlan={activateTeamPlan}
            />
          </motion.div>
        )} */}
      </div>
      {isProPackage &&
        displayParityCouponOffer &&
        state.context.quantity === 1 &&
        !isEmpty(parityCoupon) &&
        planType === 'individual' && (
          <div className="pb-5 max-w-screen-sm mx-auto">
            <ParityCouponMessage
              coupon={parityCoupon}
              countryName={countryName}
              onApply={onApplyParityCoupon}
              onDismiss={onDismissParityCoupon}
              isPPP={isPPP}
            />
          </div>
        )}
    </>
  )
}

type FeatureProps = {
  children: string | JSX.Element
  size?: 'normal' | 'large'
  className?: string
}

const Feature = ({children, size = 'normal', className = ''}: FeatureProps) => {
  const sizes = {
    normal: 'text-base',
    large: 'text-xl',
  }

  return (
    <li className={`flex items-center justify-start ${className}`}>
      <p
        className={`px-4 ${sizes[size]} leading-6 font-large text-gray-700 py-2`}
      >
        {children}
      </p>
    </li>
  )
}

export default PurchaseBundle
