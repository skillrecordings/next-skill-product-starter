import {useRouter} from 'next/router'
import React from 'react'
import getAccessTokenFromCookie from 'utils/get-access-token-from-cookie'

export default function useLoginRequired() {
  const [isVerifying, setIsVerifying] = React.useState(true)
  const token = getAccessTokenFromCookie()
  const loginRequired = !token
  const router = useRouter()
  React.useEffect(() => {
    if (loginRequired) {
      router.push('/login')
    } else {
      setIsVerifying(false)
    }
  }, [loginRequired])

  return isVerifying
}
