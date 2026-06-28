import React from "react"
import { createBrowserRouter } from "react-router-dom"

import { AppShell, Loading } from "./components/app-shell"
import { RouteError } from "./components/route-error"
import { ReaderRoute, readerLoader } from "./views/reader"
import { FeedsRoute, feedsLoader } from "./views/feeds"
import { FeedRoute, feedLoader } from "./views/feed"

export const router = createBrowserRouter(
  [
    {
      element: <AppShell />,
      hydrateFallbackElement: <Loading />,
      children: [
        { index: true, loader: readerLoader, element: <ReaderRoute />, errorElement: <RouteError /> },
        { path: "feeds", loader: feedsLoader, element: <FeedsRoute />, errorElement: <RouteError /> },
        {
          path: "feed/:feedId",
          loader: feedLoader,
          element: <FeedRoute />,
          errorElement: <RouteError />,
        },
      ],
    },
  ],
  { basename: "/reader" },
)
