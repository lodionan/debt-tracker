module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add alias for shared components
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'shared': require('path').resolve(__dirname, 'src/shared'),
      };

      return webpackConfig;
    },
  },
};