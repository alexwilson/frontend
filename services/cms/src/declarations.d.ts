declare const process: { env: { CMS_BACKEND: string | null; CMS_AUTH_URL: string | null } }

declare module 'decap-cms-backend-github' {
  export class GitHubBackend {
    token: string | null
    api: { token: string } | null
    constructor(config: unknown, options?: unknown)
    authComponent(): React.ComponentType<{ onLogin: (credentials: Record<string, unknown>) => void; error?: string; inProgress?: boolean }>
    authenticate(credentials: { token: string; [key: string]: unknown }): Promise<unknown>
    restoreUser(user: unknown): Promise<unknown>
    getToken(): Promise<string>
    [key: string]: unknown
  }
}

declare module 'decap-cms-ui-default' {
  import type React from 'react'
  // Subset of AuthenticationPage's prop surface that we use. The component
  // ships without TypeScript types, so this declaration is hand-rolled from
  // the upstream PropTypes (see decap-cms-ui-default/src/AuthenticationPage.js).
  export const AuthenticationPage: React.ComponentType<{
    onLogin?: (e: React.MouseEvent) => void
    loginDisabled?: boolean
    loginErrorMessage?: React.ReactNode
    renderButtonContent?: () => React.ReactNode
    renderPageContent?: (args: { LoginButton: React.ComponentType<unknown>; TextButton: React.ComponentType<unknown>; showAbortButton: boolean }) => React.ReactNode
    logoUrl?: string
    logo?: { src?: string; show_in_header?: boolean }
    siteUrl?: string
    t: (key: string) => string
  }>
}

declare module '*.yml' {
  const content: Record<string, unknown>
  export default content
}

declare module '*.css' {
  const styles: { toString(): string }
  export default styles
}

declare module '*.scss' {
  const styles: { toString(): string }
  export default styles
}

declare module '*.html' {
  const content: string
  export default content
}
