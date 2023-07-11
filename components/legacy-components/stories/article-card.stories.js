import { ArticleCard } from '../src/article-card';

export default {
  title: 'Legacy/Article Card',
  component: ArticleCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  args: {
    article: {
      title: "Test Article",
      slug: "/#",
      date: new Date(),
      image: {
        thumbnail: "https://avatars.githubusercontent.com/u/440052"
      },
      content: {
        excerpt: "This is some test copy"
      }
    },
    withBody: true,
    withImage: true,
    withDate: true,
  }
};
