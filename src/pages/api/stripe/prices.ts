import {NextApiRequest, NextApiResponse} from 'next'
import {fetchStripePrice} from '../../../utils/stripe'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    console.error('non-get request made')
    res.status(404).end()
  }

  try {
    const {
      query: {id},
    } = req

    if (typeof id !== 'string' || !id) {
      throw 'id is invalid.'
    }

    const price = await fetchStripePrice(id)
    const unitAmount = price?.unit_amount ?? 0
    const priceInDollars = Math.ceil(unitAmount / 100)

    res.status(200).json([
      {
        ...price,
        price: priceInDollars,
        full_price: priceInDollars,
      },
    ])
  } catch (error) {
    console.log(error)
    res.status(200).end()
  }
}

export default handler
