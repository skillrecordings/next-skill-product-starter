import React from 'react'
import {AppProps} from 'next/app'
import {DefaultSeo} from 'next-seo'
import SEO from '../../next-seo.json'
import {ThemeProvider} from 'next-themes'
import '../styles/globals.css'
import 'focus-visible'

function MyApp({Component, pageProps}: AppProps) {
  return (
    <>
      <DefaultSeo {...SEO} />
      <ThemeProvider attribute="class">
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  )
}

export default MyApp
