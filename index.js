const { root, createEvent, forward, guard, sample } = require('effector-root')
const { fork, allSettled } = require('effector/fork')
const { createRouter, createHistory } = require('trace-router')

const history = createHistory('/about:blank')
const router = createRouter({ history })

const routes = {
  home: router.add('/'),
  user: router.add('/user')
}

function createPageEvent(path) {
  const event = createEvent()

  event.watch(() => console.log('page event fired for', path))

  return event
}

const routeList = [
  {
    route: routes.home,
    event: createPageEvent('/')
  },
  {
    route: routes.user,
    event: createPageEvent('/user')
  },
  {
    route: null,
    event: createPageEvent('/not-found')
  }
]

const everythingStarted = createEvent()

sample({
  source: everythingStarted,
  fn: ({ path }) => path,
  target: router.navigate,
})

const pathSettled = createEvent()

forward({
  from: router.historyUpdated,
  to: pathSettled
})

for (const { route, event } of routeList) {
  const routeMatched = sample({
    source: route ? route.visible : router.noMatches,
    clock: pathSettled
  })

  guard({
    source: routeMatched,
    filter: Boolean,
    target: event
  })
}

async function start(path) {
  const scope = fork(root)

  await allSettled(everythingStarted, {
    scope,
    params: { path }
  })

  console.log('allSettled finished')
}

start('/')
start('/user')
start('/my-imaginary-path')