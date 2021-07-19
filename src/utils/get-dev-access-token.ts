export default function getDevAccessToken() {
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_DEV_USER_TOKEN
  }
}
