import Webmentions from '.'

const makeMention = (id, property, name, photo) => ({
  'wm-id': id,
  'wm-property': property,
  author: {
    name,
    url: `https://example.com/${name.toLowerCase().replace(' ', '-')}`,
    photo: photo ?? `https://picsum.photos/seed/${id}/64/64`,
  },
})

const mockFetch = (mentions) => async () => ({
  ok: true,
  json: async () => ({ children: mentions }),
})

const withFetchStub = (mentions) => ({
  decorators: [
    (Story) => {
      globalThis.fetch = mockFetch(mentions)
      return <Story />
    },
  ],
})

export default {
  title: 'Legacy/Organisms/Webmentions',
  component: Webmentions,
}

export const Empty = {
  args: { contentId: 'example-post-id' },
}

export const WithLikes = {
  args: { contentId: 'example-post-id' },
  ...withFetchStub([
    makeMention(1, 'like-of', 'Alice'),
    makeMention(2, 'like-of', 'Bob'),
    makeMention(3, 'like-of', 'Carol'),
  ]),
}

export const WithReposts = {
  args: { contentId: 'example-post-id' },
  ...withFetchStub([
    makeMention(4, 'repost-of', 'Dave'),
    makeMention(5, 'repost-of', 'Eve'),
  ]),
}

export const WithAll = {
  args: { contentId: 'example-post-id' },
  ...withFetchStub([
    makeMention(1, 'like-of', 'Alice'),
    makeMention(2, 'like-of', 'Bob'),
    makeMention(3, 'like-of', 'Carol'),
    makeMention(4, 'repost-of', 'Dave'),
    makeMention(5, 'repost-of', 'Eve'),
  ]),
}
