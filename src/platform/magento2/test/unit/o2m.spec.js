jest.mock('magento2-rest-client', () => ({ Magento2Client: jest.fn() }))
jest.mock('../../../../lib/redis', () => ({ getClient: jest.fn(() => ({ set: jest.fn() })) }))

const { Magento2Client } = require('magento2-rest-client')
const { processSingleOrder } = require('../../o2m')

describe('processSingleOrder payment extensions', () => {
  it.each([
    undefined,
    { generic: { nested: ['value'] } }
  ])('forwards supplied extra fields: %p', async (extraFields) => {
    const order = jest.fn().mockResolvedValue(123)

    Magento2Client.mockReturnValue({
      cart: {
        pull: jest.fn().mockResolvedValue([]),
        billingAddress: jest.fn().mockResolvedValue({}),
        shippingInformation: jest.fn().mockResolvedValue({}),
        order
      },
      directory: { countries: jest.fn().mockResolvedValue([]) },
      orders: { incrementIdById: jest.fn().mockResolvedValue({ increment_id: '123' }) }
    })

    const addressInformation = {
      billingAddress: { region_id: 1 },
      payment_method_code: 'example',
      payment_method_additional: { token: 'example' }
    }

    if (extraFields !== undefined) {
      addressInformation.paymentExtraFields = extraFields
    }

    const logger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }

    await new Promise((resolve, reject) => {
      processSingleOrder(
        { cart_id: 'cart', products: [], addressInformation },
        { magento2: { api: {} } },
        null,
        (error) => error ? reject(error) : resolve(),
        null,
        logger
      )
    })

    const payment = order.mock.calls[0][2].paymentMethod

    expect(payment.method).toBe('example')
    expect(payment.additional_data).toEqual({ token: 'example' })

    if (extraFields === undefined) {
      expect(payment).not.toHaveProperty('extension_attributes')

      return
    }

    expect(payment.extension_attributes).toBe(extraFields)
  })
})
