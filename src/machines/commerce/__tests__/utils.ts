import {getPriceParams, getStripeCheckoutParams} from '../utils'

const getContext = (options: any = {}) => {
  const defaultContext = {
    sellable: null,
    upgradeFromSellable: null,
    bulk: false,
    quantity: 1,
    stripePriceId: undefined,
  }

  return {...defaultContext, ...options}
}

describe('getPriceParams', () => {
  test('returns the stripe price id as {id}', () => {
    const machineContext = getContext({stripePriceId: 'abc123', sellable: {}})
    const params = getPriceParams(machineContext)
    expect(params).toStrictEqual({id: 'abc123'})
  })

  test('errors when sellable is null', () => {
    const machineContext = getContext()
    expect(() => getPriceParams(machineContext)).toThrow()
  })

  test('returns sellable params', () => {
    const contextOverride = {
      quantity: 1,
      sellable: {id: 'abc123', type: 'type', site: 'site'},
    }
    const machineContext = getContext(contextOverride)
    const params = getPriceParams(machineContext)
    expect(params).toStrictEqual({
      sellables: [
        {
          quantity: contextOverride.quantity,
          sellable: contextOverride.sellable.type,
          sellable_id: contextOverride.sellable.id,
          site: contextOverride.sellable.site,
        },
      ],
      site: contextOverride.sellable.site,
    })
  })

  test('returns sellable params with applied coupon', () => {
    const contextOverride = {
      quantity: 1,
      sellable: {id: 'abc123', type: 'type', site: 'site'},
      appliedCoupon: 'coupon',
    }
    const machineContext = getContext(contextOverride)
    const params = getPriceParams(machineContext)
    expect(params).toStrictEqual({
      sellables: [
        {
          quantity: contextOverride.quantity,
          sellable: contextOverride.sellable.type,
          sellable_id: contextOverride.sellable.id,
          site: contextOverride.sellable.site,
        },
      ],
      site: contextOverride.sellable.site,
      code: contextOverride.appliedCoupon,
    })
  })

  test('returns sellable params with an upgradeFromSellable', () => {
    const contextOverride = {
      quantity: 1,
      sellable: {id: 'abc123', type: 'type', site: 'site'},
      upgradeFromSellable: {
        slug: 'upgrade',
        type: 'type',
      },
    }
    const machineContext = getContext(contextOverride)
    const params = getPriceParams(machineContext)
    expect(params).toStrictEqual({
      sellables: [
        {
          quantity: contextOverride.quantity,
          sellable: contextOverride.sellable.type,
          sellable_id: contextOverride.sellable.id,
          site: contextOverride.sellable.site,
          upgrade_from_sellable_id: contextOverride.upgradeFromSellable.slug,
          upgrade_from_sellable: contextOverride.upgradeFromSellable.type,
        },
      ],
      site: contextOverride.sellable.site,
    })
  })
})

describe('getStripeCheckoutParams', () => {
  test('returns the stripe price id as {stripe_price_id}', () => {
    const machineContext = getContext({stripePriceId: 'abc123', sellable: {}})
    const params = getStripeCheckoutParams(machineContext)
    expect(params).toStrictEqual({stripe_price_id: 'abc123', quantity: 1})
  })

  test('errors when sellable is null', () => {
    const machineContext = getContext()
    expect(() => getStripeCheckoutParams(machineContext)).toThrow()
  })

  test('returns sellable params', () => {
    const contextOverride = {
      quantity: 1,
      sellable: {slug: 'abc123', type: 'type', site: 'site'},
    }
    const machineContext = getContext(contextOverride)
    const params = getStripeCheckoutParams(machineContext)
    expect(params).toStrictEqual({
      sellables: [
        {
          quantity: contextOverride.quantity,
          sellable: contextOverride.sellable.type,
          sellable_id: contextOverride.sellable.slug,
          site: contextOverride.sellable.site,
        },
      ],
    })
  })

  test('returns sellable params with applied coupon', () => {
    const contextOverride = {
      quantity: 1,
      sellable: {slug: 'abc123', type: 'type', site: 'site'},
      appliedCoupon: 'coupon',
    }
    const machineContext = getContext(contextOverride)
    const params = getStripeCheckoutParams(machineContext)
    expect(params).toStrictEqual({
      sellables: [
        {
          quantity: contextOverride.quantity,
          sellable: contextOverride.sellable.type,
          sellable_id: contextOverride.sellable.slug,
          site: contextOverride.sellable.site,
        },
      ],
      code: contextOverride.appliedCoupon,
    })
  })

  test('returns sellable params with an upgradeFromSellable', () => {
    const contextOverride = {
      quantity: 1,
      sellable: {slug: 'abc123', type: 'type', site: 'site'},
      upgradeFromSellable: {
        slug: 'upgrade',
        type: 'type',
      },
    }
    const machineContext = getContext(contextOverride)
    const params = getStripeCheckoutParams(machineContext)
    expect(params).toStrictEqual({
      sellables: [
        {
          quantity: contextOverride.quantity,
          sellable: contextOverride.sellable.type,
          sellable_id: contextOverride.sellable.slug,
          site: contextOverride.sellable.site,
          upgrade_from_sellable_id: contextOverride.upgradeFromSellable.slug,
          upgrade_from_sellable: contextOverride.upgradeFromSellable.type,
        },
      ],
    })
  })

  test('returns sellable params with bulk purchase', () => {
    const contextOverride = {
      quantity: 2,
      bulk: true,
      sellable: {slug: 'abc123', type: 'type', site: 'site'},
      upgradeFromSellable: {
        slug: 'upgrade',
        type: 'type',
      },
    }
    const machineContext = getContext(contextOverride)
    const params = getStripeCheckoutParams(machineContext)
    expect(params).toStrictEqual({
      sellables: [
        {
          bulk: contextOverride.bulk,
          quantity: contextOverride.quantity,
          sellable: contextOverride.sellable.type,
          sellable_id: contextOverride.sellable.slug,
          site: contextOverride.sellable.site,
          upgrade_from_sellable_id: contextOverride.upgradeFromSellable.slug,
          upgrade_from_sellable: contextOverride.upgradeFromSellable.type,
        },
      ],
    })
  })
})
