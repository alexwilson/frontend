import React from 'react'
import Pagination from '.'

export default {
  title: 'Legacy/Molecules/Pagination',
  component: Pagination,
  parameters: { layout: 'padded' },
}

export const Default = {
  args: { currentPage: 3, totalPages: 7, basePath: '/blog' },
}

export const FirstPage = {
  args: { currentPage: 1, totalPages: 5, basePath: '/blog' },
}

export const LastPage = {
  args: { currentPage: 5, totalPages: 5, basePath: '/blog' },
}

export const TwoPages = {
  args: { currentPage: 1, totalPages: 2, basePath: '/blog' },
}
