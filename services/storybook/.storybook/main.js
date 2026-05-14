const path = require('path')

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
module.exports = {
  stories: ['../../../components/**/src/**/*.stories.@(mdx|js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async (config) => {
    const componentsDir = path.resolve(__dirname, '../../../components')

    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      include: [componentsDir],
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-env',
            ['@babel/preset-react', { runtime: 'automatic' }],
            '@babel/preset-typescript',
          ],
        },
      },
    })

    config.resolve.extensions = [
      ...(config.resolve.extensions ?? []),
      '.ts',
      '.tsx',
    ]

    config.module.rules.push({
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
    })

    config.module.rules.push({
      test: /\.svg$/,
      type: 'asset/resource',
    })

    config.resolve.alias = {
      ...config.resolve.alias,
      'isomorphic-fetch': path.resolve(__dirname, 'isomorphic-fetch-stub.js'),
    }

    return config
  },
}
