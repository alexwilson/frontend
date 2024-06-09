import { ShareWidget } from '../src/share-widget';

export default {
  title: 'Legacy/Share Widget',
  component: ShareWidget,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  args: {
    url: "https://example.com",
    title: "Example"
  }
};
