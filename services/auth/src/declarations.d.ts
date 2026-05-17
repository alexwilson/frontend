// Lets us `import css from '...css'` and get the file's contents as a string.
// The actual loading is done by wrangler's Text rule in wrangler.toml.
declare module '*.css' {
  const content: string
  export default content
}
