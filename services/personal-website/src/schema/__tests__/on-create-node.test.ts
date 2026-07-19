import { describe, it, expect } from "vitest"
import { isPagesCollectionNode } from "../on-create-node"

type Parent = { sourceInstanceName?: string } | undefined

const makeArgs = (parent: Parent) => ({
  node: { parent: parent ? "parent-id" : null } as never,
  getNode: () => parent as never,
})

describe("isPagesCollectionNode", () => {
  it("is true when the parent File is from the pages source instance", () => {
    expect(isPagesCollectionNode(makeArgs({ sourceInstanceName: "pages" }))).toBe(
      true,
    )
  })

  it("is false for the posts source instance", () => {
    expect(isPagesCollectionNode(makeArgs({ sourceInstanceName: "posts" }))).toBe(
      false,
    )
  })

  it("is false when there is no parent", () => {
    expect(isPagesCollectionNode(makeArgs(undefined))).toBe(false)
  })
})
