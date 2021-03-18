import * as React from 'react'
import {useViewportScroll} from 'framer-motion'
import {useLocalStorage} from 'react-use'
import {Dialog} from '@reach/dialog'
import ConvertkitSubscribeForm from 'components/forms/convertkit'

function usePoliteConvertkitForm(
  threshold: 0.6 | 0.7 | 0.75 | 0.8 | 0.85 | 0.9,
) {
  const {scrollYProgress} = useViewportScroll()
  const [peaking, setPeaking] = React.useState<boolean>(false)
  const [opened, setOpened] = React.useState<boolean>(false)

  // TODO: get user preference from CK or Customer.io
  const [dismissed, setDismissed, _removeDismissedPreference] = useLocalStorage(
    'dismissed-polite-message',
    'false',
  )

  scrollYProgress.onChange((y) => {
    const yRound = Number(y.toFixed(1))
    if (yRound === threshold) {
      setPeaking(opened ? false : true)
    }
  })

  function handleOpen() {
    setOpened(true)
    setPeaking(false)
  }

  function handleDismiss() {
    setOpened(false)
    setDismissed('true')
  }

  return {
    peaking,
    dismissed,
    setOpened,
    opened,
    setPeaking,
    handleOpen,
    handleDismiss,
  }
}

const PoliteConvertkitForm = ({children, peakingContent}: any) => {
  const {
    peaking,
    opened,
    dismissed,
    handleOpen,
    handleDismiss,
  } = usePoliteConvertkitForm(0.7)

  return dismissed !== 'true' ? (
    <>
      <div
        className={`${
          peaking ? 'left-0 -rotate-3' : '-left-1/2 rotate-0'
        } fixed bottom-24 -translate-x-3 rounded-md bg-black transform transition-all ease-in-out duration-300  text-white text-lg`}
      >
        <div className="max-w-md pl-10 p-5">
          {peakingContent}
          <div className="space-x-2 pt-4">
            <button
              className="bg-white text-black px-4 py-2 rounded-md"
              onClick={() => handleOpen()}
            >
              Yes!
            </button>
            <button
              className="bg-gray-600 text-white px-4 py-2 rounded-md"
              onClick={() => handleDismiss()}
            >
              No
            </button>
          </div>
        </div>
      </div>
      <Dialog isOpen={opened} onDismiss={() => handleDismiss()}>
        <div className="pb-4">{children}</div>
        <ConvertkitSubscribeForm />
      </Dialog>
    </>
  ) : null
}

export default PoliteConvertkitForm
export {usePoliteConvertkitForm}
