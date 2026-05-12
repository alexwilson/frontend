import ArticleCard from '.'

export default {
  title: 'Legacy/Molecules/ArticleCard',
  component: ArticleCard,
  args: {
    article: {
      title: 'An example article',
      slug: '/blog/example-article',
      date: '2024-06-01',
      content: { excerpt: 'This is a short excerpt describing the article content.' },
      image: { thumbnail: 'https://picsum.photos/seed/article/400/300' },
    },
  },
}

export const Default = {}

export const WithoutImage = {
  args: { withImage: false },
}

export const WithoutDate = {
  args: { withDate: false },
}

export const WithoutBody = {
  args: { withBody: false },
}

export const RelatedArticle = {
  args: { withBody: false, withDate: false },
}

export const ExternalLink = {
  args: {
    article: {
      title: 'An external article',
      url: 'https://example.com/post',
      date: '2024-06-01',
      content: { excerpt: 'This article links to an external site.' },
      image: null,
    },
  },
}
