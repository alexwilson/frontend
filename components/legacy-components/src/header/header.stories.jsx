import Header from '.'

export default {
  title: 'Legacy/Header',
  component: Header,
  args: {
    location: { pathname: '/' },
    image: 'https://picsum.photos/seed/header/1920/600',
  },
  parameters: {
    layout: 'fullscreen',
  },
}

export const Default = {}

export const BlogSection = {
  args: {
    location: { pathname: '/blog' },
    section: 'blog',
  },
}

export const TalksSection = {
  args: {
    location: { pathname: '/talks' },
    section: 'talks',
  },
}

export const NoImage = {
  args: { image: null },
}
