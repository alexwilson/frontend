import { globby } from "globby";

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
  stories: [
    "../../../components/**/src/*.stories.@(mdx|js|jsx|ts|tsx)",
    "../../../components/**/stories/**/*.@(mdx|stories.@(js|jsx|mjs|ts|tsx))",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/preset-scss",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
};
export default config;
