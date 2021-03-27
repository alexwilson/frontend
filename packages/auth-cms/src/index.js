import { auth, authCallback } from './auth.js'

addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event))
  } catch (e) {
    event.respondWith(new Response('Internal Error', { status: 500 }))
  }
})

async function handleEvent(event) {
  const url = new URL(event.request.url)
  switch (url.pathname) {
    case '/auth/cms': {
      return await auth(url);
    }
    case '/auth/cms/callback': {
      return await authCallback(url);
    }
    default: {
      throw new Error('Not found!');
    }
  }
}
