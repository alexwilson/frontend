declare const process: { env: { CMS_BACKEND: string | null } }

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
