import * as React from 'react'
import DarkModeToggle from './color-mode-toggle'
import config from '../../config.json'
import Link from 'next/link'

const Navigation = () => {
  return (
    <nav className="w-full flex items-center justify-between print:hidden">
      <Link href="/">
        <a className="dark:hover:text-rose-300 hover:text-rose-500 text-lg font-bold tracking-tight leading-tight">
          {config.title}
        </a>
      </Link>
      <DarkModeToggle />
    </nav>
  )
}

export default Navigation
