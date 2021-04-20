import Layout from 'layouts'
import Link from 'next/link'
import ConvertkitSubscribeForm from 'components/forms/convertkit'

const index = [
  {
    label: 'templates',
    items: [
      {
        label: 'Article',
        link: '/article',
      },
      {
        label: 'Video',
        link: '/video',
      },
    ],
  },
  {
    label: 'pages',
    items: [
      {
        label: '',
        items: [
          {
            label: 'Confirm',
            link: '/confirm',
          },
          {
            label: 'Confirmed',
            link: '/confirmed',
          },
          {
            label: 'Excited',
            link: '/excited',
          },
          {
            label: 'Unsubscribed',
            link: '/unsubscribed',
          },
        ],
      },
      {
        label: 'Quiz',
        link: '/answer?question=interviews',
      },
      {
        label: 'Login',
        link: '/login',
      },
      {
        label: 'Thanks',
        link: '/thanks?email=example@email.com',
      },
      {
        label: 'Buy',
        link: '/buy',
      },
    ],
  },
  {
    label: 'components',
    items: [
      {
        component: (
          <ConvertkitSubscribeForm
            onSubmit={() => {
              window.alert('Configure me!')
            }}
          >
            <div className="pb-4 font-bold sm:text-xl text-lg tracking-tight">
              Subscribe Form
            </div>
          </ConvertkitSubscribeForm>
        ),
      },
    ],
  },
]

export default function Home() {
  return (
    <Layout>
      <div className="space-y-16">
        {index.map((section) => {
          return (
            <section className="pt-16">
              <h2 className="uppercase font-semibold tracking-wide text-sm pb-4 dark:text-gray-300 text-gray-600">
                {section.label}
              </h2>
              <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
                {section?.items?.map((item: any) => {
                  return (
                    (item.link && (
                      <Link href={item.link}>
                        <a className="rounded-lg border-2 dark:hover:bg-gray-900 hover:bg-gray-100 dark:border-gray-900 border-gray-100 dark:bg-black bg-white text-3xl font-extrabold tracking-tight py-24 flex items-center justify-center flex-col transition-colors duration-100 ease-in-out">
                          {item.label}
                        </a>
                      </Link>
                    )) ||
                    (item.items && (
                      <div className="rounded-lg border-2 dark:border-gray-900 border-gray-100 dark:bg-black bg-white text-3xl font-extrabold tracking-tight py-24 flex items-center justify-center flex-col transition-colors duration-100 ease-in-out">
                        {item.items.map((item: any) => (
                          <Link href={item.link}>
                            <a className="dark:hover:text-rose-300 hover:text-rose-500">
                              {item.label}
                            </a>
                          </Link>
                        ))}
                      </div>
                    )) || (
                      <div className="sm:p-8 p-4 border-2 dark:border-gray-900 border-gray-100 dark:bg-black bg-white rounded-lg transition-colors duration-100 ease-in-out">
                        {item.component}
                      </div>
                    )
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </Layout>
  )
}
