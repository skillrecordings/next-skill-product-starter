import * as React from 'react'
import {useFormik} from 'formik'
import ReactMarkdown from 'react-markdown'

type MultipleChoiceQuestionTypes = {
  onAnswer: Function
  choices: any[]
}

const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionTypes> = ({
  onAnswer,
  choices,
}) => {
  const formik = useFormik({
    initialValues: {
      picked: '',
    },
    onSubmit: (values: any) => {
      onAnswer(values.picked)
    },
  })

  return (
    <div>
      <ul className="flex flex-col overflow-hidden rounded-md">
        {choices.map((choice, i) => {
          return (
            <li key={choice.answer} className="inline-block w-full">
              <label
                className={`border-b ${
                  i === choices.length - 1
                    ? 'border-transparent'
                    : 'dark:border-gray-900 border-gray-100'
                } flex items-center py-5 px-3 text-lg font-semibold cursor-pointer transition-all duration-150 dark:hover:bg-gray-900 hover:bg-gray-100`}
              >
                <input
                  type="radio"
                  name="picked"
                  value={choice.answer}
                  className="appearance-none bg-gray-200 dark:bg-gray-900 border-none hover:bg-gray-400 hover:dark:bg-gray-700"
                  onChange={() => {
                    formik.setValues({picked: choice.answer})
                    formik.submitForm()
                  }}
                />
                <ReactMarkdown className="pl-3 leading-tight">
                  {choice.label}
                </ReactMarkdown>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default MultipleChoiceQuestion
