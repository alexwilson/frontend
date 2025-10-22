import GatsbyLink from '../GatsbyLink'
import Link, { Link as NamedLink } from '@alexwilson/legacy-components/src/link'

describe('gatsby webpack alias for legacy link', () => {
  it('maps the legacy link entry point to GatsbyLink', () => {
    expect(Link).toBe(GatsbyLink)
    expect(NamedLink).toBe(GatsbyLink)
  })
})
