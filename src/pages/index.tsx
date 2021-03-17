import Layout from 'layouts'
import Link from 'next/link'
import ConvertkitSubscribeForm from 'components/forms/convertkit'

export default function Home() {
  return (
    <Layout>
      <div className="space-y-16">
        <section className="pt-16">
          <h2 className="uppercase font-semibold tracking-wide text-sm pb-4 dark:text-gray-300 text-gray-600">
            Templates
          </h2>
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
            <Link href="/article">
              <a className="rounded-lg border-2 dark:hover:bg-gray-900 hover:bg-gray-100 dark:border-gray-900 border-gray-100 dark:bg-black bg-white text-3xl font-extrabold tracking-tight py-24 flex items-center justify-center flex-col transition-colors duration-100 ease-in-out">
                Article
              </a>
            </Link>
            <Link href="/video">
              <a className="rounded-lg border-2 dark:hover:bg-gray-900 hover:bg-gray-100 dark:border-gray-900 border-gray-100 dark:bg-black bg-white text-3xl font-extrabold tracking-tight py-24 flex items-center justify-center flex-col transition-colors duration-100 ease-in-out">
                Video
              </a>
            </Link>
          </div>
        </section>
        <section>
          <h2 className="uppercase font-semibold tracking-wide text-sm pb-4 dark:text-gray-300 text-gray-600">
            Pages
          </h2>
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
            <div className="rounded-lg border-2 dark:border-gray-900 border-gray-100 dark:bg-black bg-white text-3xl font-extrabold tracking-tight py-24 flex items-center justify-center flex-col transition-colors duration-100 ease-in-out">
              <Link href="/confirm">
                <a className="dark:hover:text-rose-300 hover:text-rose-500">
                  Confirm
                </a>
              </Link>
              <Link href="/confirmed">
                <a className="dark:hover:text-rose-300 hover:text-rose-500">
                  Confirmed
                </a>
              </Link>
              <Link href="/excited">
                <a className="dark:hover:text-rose-300 hover:text-rose-500">
                  Excited
                </a>
              </Link>
              <Link href="/unsubscribed">
                <a className="dark:hover:text-rose-300 hover:text-rose-500">
                  Unsubscribed
                </a>
              </Link>
            </div>
            <Link href="/answer?question=interviews">
              <a className="rounded-lg border-2 dark:hover:bg-gray-900 hover:bg-gray-100 dark:border-gray-900 border-gray-100 dark:bg-black bg-white text-3xl font-extrabold tracking-tight py-24 flex items-center justify-center flex-col transition-colors duration-100 ease-in-out">
                Answer (Quiz)
              </a>
            </Link>
          </div>
        </section>
        <section>
          <h2 className="uppercase font-semibold tracking-wide text-sm pb-4 dark:text-gray-300 text-gray-600">
            Components
          </h2>
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
            <div className="sm:p-8 p-4 border-2 dark:border-gray-900 border-gray-100 dark:bg-black bg-white rounded-lg transition-colors duration-100 ease-in-out">
              <ConvertkitSubscribeForm>
                <div className="pb-4 font-bold sm:text-xl text-lg tracking-tight">
                  Subscribe Form
                </div>
              </ConvertkitSubscribeForm>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}
