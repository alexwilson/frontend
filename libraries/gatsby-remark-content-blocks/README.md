# @alexwilson/gatsby-remark-content-blocks

Registers content blocks into `gatsby-transformer-remark`'s `html` field.

```ts
// gatsby-config.ts
{
  resolve: `gatsby-transformer-remark`,
  options: {
    plugins: [
      `@alexwilson/gatsby-remark-content-blocks`,
      // …existing sub-plugins
    ],
  },
}
```
