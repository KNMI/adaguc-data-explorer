module.exports = function (api) {
  const presets = [
    '@babel/preset-typescript',
    '@babel/preset-env',
    '@babel/preset-react',
  ];
  const plugins = [
    [
      '@babel/plugin-transform-runtime',
      {
        regenerator: true,
      },
    ],
  ];

  api.cache(false);

  return {
    presets,
    plugins,
  };
};
