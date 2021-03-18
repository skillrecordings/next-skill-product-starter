import * as React from 'react'

const FORM_ID = '123456'

type ConvertkitSubscribeFormProps = {
  onSubmit: () => void
}

const ConvertkitSubscribeForm: React.FC<ConvertkitSubscribeFormProps> = ({
  children,
  onSubmit,
}) => {
  return (
    <div id="subscribe">
      {children}
      <form
        action={`https://app.convertkit.com/forms/${FORM_ID}/subscriptions`}
        method="post"
        className="space-y-4 w-full"
        onSubmit={() => onSubmit()}
      >
        <div>
          <label
            htmlFor="fields[first_name]"
            className="text-sm font-semibold block"
          >
            First Name
          </label>
          <input
            placeholder="Preferred name"
            id="fields[first_name]"
            name="fields[first_name]"
            type="text"
            className="w-full rounded-sm dark:bg-gray-900 dark:text-white dark:placeholder-gray-300"
          />
        </div>
        <div>
          <label
            htmlFor="email_address"
            className="text-sm font-semibold block"
          >
            Email
          </label>
          <div>
            <input
              placeholder="@"
              id="email_address"
              type="email"
              name="email_address"
              className="w-full rounded-sm dark:bg-gray-900 dark:text-white dark:placeholder-gray-300"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full px-3 py-2 font-semibold dark:bg-white dark:text-black bg-black text-white rounded-sm"
        >
          Subscribe
        </button>
        <div className="text-xs italic text-center">
          No spam, unsubscribe any time.
        </div>
      </form>
    </div>
  )
}

export default ConvertkitSubscribeForm
