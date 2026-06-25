import type { GatsbyBrowser } from "gatsby"

// The firehose and per-feed pages render a virtualised list (react-virtuoso),
// which manages its own scroll restoration. Gatsby's default would snap the
// window before the virtual list has rendered its height, landing at the top.
// Let Virtuoso own scroll on those routes; leave everything else to Gatsby.
export const shouldUpdateScroll: GatsbyBrowser["shouldUpdateScroll"] = ({
  routerProps,
}) => {
  const path = (routerProps?.location?.pathname ?? "").replace(/\/+$/, "")
  const isIndex = path === "" || path.endsWith("/reader")
  const isFeedPage = /\/feed\/[^/]+$/.test(path)
  return !(isIndex || isFeedPage)
}
