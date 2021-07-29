import {NextApiRequest, NextApiResponse} from 'next'
import {convertkitAxios} from 'utils/axios-convertkit-api'
import fetchConvertkitSubscriberFromServerCookie from 'utils/fetch-convertkit-subscriber'
import isEmpty from 'lodash/isEmpty'

const answer = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    try {
      console.log(req.body)
      const {tagId, quiz} = req.body
      const cookieHeader = req.headers.cookie as string
      const [subscriber, ckCookie] =
        await fetchConvertkitSubscriberFromServerCookie(cookieHeader)

      // Subscribe user to tagId
      await convertkitAxios.post(`/tags/${tagId}/subscribe`, {
        api_key: process.env.NEXT_PUBLIC_CONVERTKIT_TOKEN,
        email: subscriber.email_address,
      })

      // Create Quiz answers field if it doesn't exist yet
      if (!subscriber.fields.quiz_answers) {
        await convertkitAxios.post(`/custom_fields`, {
          api_secret: process.env.CONVERTKIT_API_SECRET,
          label: 'Quiz answers',
        })
      }

      // Update Quiz answers field with submitted answer along with a question id
      await convertkitAxios.put(`/subscribers/${subscriber.id}`, {
        api_secret: process.env.CONVERTKIT_API_SECRET,
        fields: {
          quiz_answers: !isEmpty(subscriber.fields.quiz_answers)
            ? `${JSON.stringify(quiz)},${subscriber.fields.quiz_answers}`
            : JSON.stringify(quiz),
        },
      })

      res.setHeader('Set-Cookie', ckCookie)
      res.setHeader('Cache-Control', 'max-age=10')
      res.status(200).json(subscriber)
    } catch (error) {
      console.log(error)
      res.status(200).end()
    }
  } else {
    console.error('non-post request made')
    res.status(404).end()
  }
}

export default answer
