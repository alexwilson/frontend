const path = require('path')

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
module.exports = {
  stories: ['../../../components/**/src/**/*.stories.@(mdx|js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async (config) => {
    const componentsDir = path.resolve(__dirname, '../../../components')

    // Transpile JSX from monorepo components with automatic runtime so
    // story files don't need to import React explicitly.
    config.module.rules.push({
      test: /\.(js|jsx)$/,
      include: [componentsDir],
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-env',
            ['@babel/preset-react', { runtime: 'automatic' }],
          ],
        },
      },
    })

    config.module.rules.push({
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
    })

    return config
  },
}
