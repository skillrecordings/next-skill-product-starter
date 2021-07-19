import {createMachine, assign} from 'xstate'
import Auth from 'utils/auth'
import {identify} from 'utils/analytics'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import get from 'lodash/get'
import filter from 'lodash/filter'
import reduce from 'lodash/reduce'
import queryString from 'query-string'
import {isBrowser} from 'utils/is-browser'
import getDevAccessToken from 'utils/get-dev-access-token'
import {SellableResource, Viewer} from '@types'

const auth = new Auth()

interface GetAccessTokenArgs {
  access_token?: string
}
const getAccessToken = (options: GetAccessTokenArgs) => {
  const devAccessToken = getDevAccessToken()

  return devAccessToken ?? get(options, 'access_token')
}

interface FetchViewerArgs {
  accessToken?: string
  viewAsUser?: string | null
  refreshViewer?: boolean
}

async function fetchViewer({
  accessToken,
  viewAsUser,
  refreshViewer,
}: FetchViewerArgs): Promise<Viewer> {
  if (!isBrowser()) {
    return Promise.reject('localstorage not available')
  }

  const devAccessToken = getDevAccessToken()

  if (devAccessToken) {
    return await auth.setSession(devAccessToken)
  }

  if (viewAsUser && accessToken) {
    return await auth.becomeUser(viewAsUser, accessToken)
  } else if (window.location.pathname === '/redirect') {
    return await auth.handleAuthentication()
  } else if (refreshViewer) {
    return await auth.refreshUser()
  }

  return auth.getLocalUser()
}

const getSitePurchases = (viewer: Viewer) =>
  filter(get(viewer, 'purchased', []), {
    site: process.env.NEXT_PUBLIC_SITE_NAME,
  })

const getCanViewContent = (sitePurchases: SellableResource[]) => {
  return reduce(
    sitePurchases,
    (canViewContent, currentPurchase) => {
      if (canViewContent) {
        return canViewContent
      }

      return currentPurchase?.bulk === false
    },
    false,
  )
}

const getIsUnclaimedBulkPurchaser = (viewer: Viewer) => {
  const sitePurchases = getSitePurchases(viewer)
  const canViewContent = getCanViewContent(sitePurchases)
  return !canViewContent && sitePurchases.length > 0
}

type ViewerContext = {
  viewer?: Viewer | null
  viewAsUser?: string | null
  error?: string | null
}

export type ViewerEvent =
  | {type: 'REPORT_IS_LOGGED_IN'; viewer: Viewer; viewAsUser: string}
  | {type: 'REPORT_IS_LOGGED_OUT'}
  | {type: 'LOG_IN'; viewer: Viewer}
  | {type: 'LOG_OUT'}
  | {type: 'REFRESH_VIEWER'}
  | {type: 'REPORT_REFRESHED_VIEWER'; viewer: Viewer}

type ViewerState =
  | {
      value: 'checkingIfLoggedIn'
      context: ViewerContext & {
        viewer: undefined
        viewAsUser: undefined
        error: undefined
      }
    }
  | {
      value: 'loggedIn'
      context: ViewerContext & {
        viewer: Viewer
        viewAsUser: string | undefined
        error: undefined
      }
    }
  | {
      value: 'loggedOut'
      context: ViewerContext & {
        viewer: undefined
        viewAsUser: undefined
        error: string | undefined
      }
    }

export const authenticationMachine = createMachine<
  ViewerContext,
  ViewerEvent,
  ViewerState
>(
  {
    id: 'authentication',
    initial: 'checkingIfLoggedIn',
    context: {
      viewer: undefined,
      viewAsUser: undefined,
      error: undefined,
    },
    states: {
      checkingIfLoggedIn: {
        invoke: {
          src: 'checkIfLoggedIn',
          onError: {
            target: 'loggedOut',
          },
        },
        on: {
          REPORT_IS_LOGGED_IN: {
            target: 'loggedIn',
            actions: 'assignViewerToContext',
          },
          REPORT_IS_LOGGED_OUT: 'loggedOut',
        },
      },
      loggedIn: {
        entry: ['identify', 'navigate'],
        on: {
          LOG_OUT: {
            target: 'loggedOut',
          },
        },
        initial: 'stable',
        states: {
          stable: {
            on: {
              REFRESH_VIEWER: {
                target: 'refreshing',
              },
            },
          },
          refreshing: {
            invoke: {src: 'refreshViewer'},
            on: {
              REPORT_REFRESHED_VIEWER: {
                target: 'stable',
                actions: 'assignViewerToContext',
              },
            },
          },
        },
      },
      loggedOut: {
        entry: ['clearViewerFromContext', 'clearStorage', 'navigate'],
        invoke: {
          src: 'loggedOutInterval',
        },
        on: {
          LOG_IN: {
            target: 'loggedIn',
            actions: 'assignViewerToContext',
          },
        },
      },
    },
  },
  {
    services: {
      refreshViewer: (_context, _event) => async (send, _onReceive) => {
        try {
          const newViewer = await fetchViewer({
            refreshViewer: true,
          })

          send({
            type: 'REPORT_REFRESHED_VIEWER',
            viewer: newViewer,
          })
        } catch (e) {
          send({type: 'LOG_OUT'})
        }
      },
      loggedOutInterval: (context, _event) => (send, _onReceive) => {
        const id = auth.monitor(() => {
          const newViewer = auth.getLocalUser()
          if (!isEmpty(newViewer) && !isEqual(newViewer, context.viewer)) {
            send({type: 'LOG_IN', viewer: newViewer})
          }
        })

        return () => clearInterval(id)
      },
      checkIfLoggedIn: (_context, _event) => async (send, _onReceive) => {
        try {
          const queryHash = queryString.parse(window.location.hash)
          const accessToken = getAccessToken(queryHash)
          const querySearch = queryString.parse(window.location.search)
          const viewAsUser = get(querySearch, 'show-as-user') as string | null
          const newViewer = await fetchViewer({
            accessToken,
            viewAsUser,
          })

          if (isEmpty(newViewer)) return {type: 'REPORT_IS_LOGGED_OUT'}

          return {
            type: 'REPORT_IS_LOGGED_IN',
            viewer: newViewer,
            viewAsUser,
          }
        } catch (e) {
          console.error({e})
          return null
        }
      },
    },
    actions: {
      identify: (context) => {
        if (context.viewer) identify(context.viewer)
      },
      navigate: (context, event) => {
        if (!isBrowser() || !context.viewer) {
          return
        }
        switch (event.type) {
          case 'REPORT_IS_LOGGED_IN': {
            if (window.location.pathname !== '/redirect') {
              return
            }
            if (getIsUnclaimedBulkPurchaser(context.viewer)) {
              window.location.replace('/invoice')
            } else if (getCanViewContent(context.viewer.purchases)) {
              window.location.replace('/learn')
            }
            return
          }
          case 'LOG_OUT': {
            window.location.replace('/login')
            return
          }
        }
      },
      assignViewerToContext: assign((_context, event) => {
        if (
          event.type !== 'REPORT_IS_LOGGED_IN' &&
          event.type !== 'REPORT_REFRESHED_VIEWER'
        ) {
          return {}
        }
        return {
          viewer: event.viewer,
        }
      }),
      clearViewerFromContext: assign((_context, _event) => ({
        viewer: undefined,
        viewAsUser: undefined,
        error: undefined,
      })),
      clearStorage: () => {
        auth.logout()
      },
    },
  },
)

export default authenticationMachine
