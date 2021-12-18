import * as Sentry from '@sentry/node'

export async function logError(error) {
    const {init,captureException,close} = Sentry
    Sentry.init({ dsn: process.env.SENTRY_DSN })
    Sentry.captureException(error)
    await Sentry.close(200)
}
