declare module '*.svg' {
  const url: string
  export default url
}

declare module '*.scss' {}

declare module 'promise-image-loader' {
  export default function promiseImageLoader(image: HTMLImageElement): Promise<HTMLImageElement>
}
