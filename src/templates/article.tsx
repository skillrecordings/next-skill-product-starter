import * as React from 'react'
import Layout from 'layouts'

type ArticleTemplateProps = {
  meta?: any
}

const ArticleTemplate: React.FC<ArticleTemplateProps> = ({meta, children}) => {
  const {title} = meta
  return (
    <Layout meta={meta}>
      <article>
        <header>
          {title && (
            <h1 className="lg:text-8xl md:text-6xl text-5xl font-extrabold tracking-tight leading-tight text-center  py-32">
              {title}
            </h1>
          )}
        </header>
        <main className="prose dark:prose-dark sm:prose-xl prose-lg mx-auto py-32 max-w-screen-sm">
          {children}
        </main>
        <footer className="mx-auto max-w-screen-sm border-t dark:border-gray-800 border-gray-200 py-16">
          {meta.contributors && `by ${meta.contributors[0].name}`}
        </footer>
      </article>
    </Layout>
  )
}

export default ArticleTemplate
