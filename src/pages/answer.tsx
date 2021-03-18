import React, {FunctionComponent} from 'react'
import {shuffle, isEmpty, get} from 'lodash'
import MultipleChoiceQuestion from 'components/forms/multiple-choice-question'
import {useRouter} from 'next/router'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import SEO from '../../next-seo.json'
import Layout from 'layouts'

type AnswerProps = {
  questions: any
}

const Answer: FunctionComponent<AnswerProps> = () => {
  const router = useRouter()
  const [answered, setAnswered] = React.useState('')
  const [currentQuestion, setCurrentQuestion] = React.useState('')

  React.useEffect(() => {
    const question: any = get(router.query, 'question')

    if (!isEmpty(question)) {
      setCurrentQuestion(question)
    }
  }, [router])

  const setAnswer = (answer: string) => {
    axios.post(`/api/answer`, {
      tagId: questions[currentQuestion].tagId,
    })
    const correct: boolean = questions[currentQuestion].correct === answer
    setAnswered(correct ? 'correct' : 'wrong')
  }

  return (
    <Layout>
      <div className="py-16 max-w-screen-sm mx-auto">
        {currentQuestion && (
          <div>
            <ReactMarkdown className="pb-5 dark:text-white text-black prose dark:prose-dark prose-xl text-2xl font-bold leading-tight">
              {answered
                ? answered === 'correct'
                  ? `Correct! ⭐️`
                  : `That's the wrong answer.`
                : questions[currentQuestion].question}
            </ReactMarkdown>

            {answered ? (
              answered === 'correct' ? (
                <div className="prose dark:prose-dark prose-lg">
                  <p>Nice work. You chose the correct answer.</p>
                  {questions[currentQuestion].finalQuestion ? (
                    <p>
                      This was the last email in the course! I hope it was
                      helpful and appreciate your time and attention.
                    </p>
                  ) : (
                    <p>
                      I'll send the next lesson in 5-10 minutes. Check your
                      inbox.
                    </p>
                  )}

                  <p>Thanks, {SEO.openGraph.profile.firstName}</p>
                </div>
              ) : (
                <div className="prose dark:prose-dark prose-lg">
                  <p>
                    You didn't answer correctly, but don't worry. Just go back
                    and re-read the email and check out any linked resources.
                    You can click the link in your email if you'd like to try
                    again! 👍
                  </p>
                  {questions[currentQuestion].finalQuestion ? (
                    <p>
                      This was the last email in the course! I hope it was
                      helpful and appreciate your time and attention.
                    </p>
                  ) : (
                    <p>
                      I'll send the next lesson in 5-10 minutes. Check your
                      inbox.
                    </p>
                  )}

                  <p>Thanks, {SEO.openGraph.profile.firstName}</p>
                </div>
              )
            ) : (
              <MultipleChoiceQuestion
                onAnswer={setAnswer}
                choices={shuffle(questions[currentQuestion].choices)}
              />
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

const questions: any = {
  interviews: {
    question: `Which of the following is **not** an additional deliverable you might submit for a coding project?`,
    tagId: 1988924,
    correct: 'resume',
    choices: [
      {
        answer: 'improve',
        label: 'A list of areas you could improve upon',
      },
      {
        answer: 'resume',
        label: 'Your resume',
      },
      {
        answer: 'enhancements',
        label: 'A list of enhancements you might make',
      },
      {
        answer: 'readme',
        label: 'A README with clear instructions on how to run the app',
      },
    ],
  },
}

export default Answer
