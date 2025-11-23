module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add TypeScript support for shared library
      webpackConfig.module.rules.unshift({
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: require.resolve('./tsconfig.json'),
              transpileOnly: true,
            },
          },
        ],
        include: /shared/,
        exclude: /node_modules/,
      });

      return webpackConfig;
    },
  },
};