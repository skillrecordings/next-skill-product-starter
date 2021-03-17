import React, {FunctionComponent} from 'react'
import {NextSeo} from 'next-seo'
import Navigation from 'components/navigation'
import Footer from 'components/footer'

type LayoutProps = {
  meta?: any
}

const DefaultLayout: FunctionComponent<LayoutProps> = ({children, meta}) => {
  const {title, description, titleAppendSiteName = false, url, ogImage} =
    meta || {}
  return (
    <>
      <NextSeo
        title={title}
        description={description}
        titleTemplate={titleAppendSiteName ? undefined : '%s'}
        openGraph={{
          title,
          description,
          url,
          images: ogImage ? [ogImage] : undefined,
        }}
        canonical={url}
      />
      <div className="p-5 flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-grow flex flex-col justify-center">
          {children}
        </main>
        <Footer />
      </div>
    </>
  )
}

export default DefaultLayout
