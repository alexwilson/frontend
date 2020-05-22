const { generateBlogSlug, generateTalkSlug } = require('../../src/lib/slug-generation')

test('Generates Blog slugs based on filename', () => {
  expect(generateBlogSlug('2019-04-16-a-legit-post'))
    .toBe('/blog/2019/04/16/a-legit-post/')
})

test('Is unable to generate blog slugs without a date', () => {
  expect(() => generateBlogSlug('a-broken-post'))
    .toThrow(TypeError)
})


test('Generates Talk slugs based on filename', () => {
  expect(generateTalkSlug('2017-02-11-a-talk'))
    .toBe('/talks/2017-02-11-a-talk/')
})
