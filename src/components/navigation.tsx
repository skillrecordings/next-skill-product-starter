import * as React from 'react'
import DarkModeToggle from './color-mode-toggle'
import SEO from '../../next-seo.json'
import Link from 'next/link'

const Navigation = () => {
  return (
    <nav className="w-full flex items-center justify-between">
      <Link href="/">
        <a className="dark:hover:text-rose-300 hover:text-rose-500 text-lg font-bold tracking-tight leading-tight">
          {SEO.title}
        </a>
      </Link>
      <DarkModeToggle />
    </nav>
  )
}

export default Navigation
