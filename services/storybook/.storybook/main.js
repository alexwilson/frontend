import { globby } from 'globby';

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
  stories: async (list) => {
    console.log(list)
    const storyPaths = ["../stories/**/*.stories.mdx", "../stories/**/*.stories.@(js|jsx|ts|tsx)"];
    const componentDirectories = await globby(["../../components/**"], {
      gitignore: false,
      expandDirectories: false,
      onlyDirectories: true,
      deep: 1
    });
    for (const componentDirectory of componentDirectories) {
      const stories = await globby([
        `${componentDirectory}/stories/*.stories.@(mdx|js|jsx|ts|tsx)`,
        `${componentDirectory}/src/*.stories.@(mdx|js|jsx|ts|tsx)`
      ], {
        gitignore: false,
        expandDirectories: false,
        deep: 1
      });
      storyPaths.push(...stories.map(storyPath => `../${storyPath}`));
    }
    return storyPaths;
  },
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/preset-scss"
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  // webpackFinal: async config => {
  //   config.module.rules[0].exclude = [/node_modules\/(?!(gatsby|gatsby-script)\/)/]
  //   config.resolve.mainFields = ["browser", "module", "main"]
  //   return config
  // },
};
export default config;
