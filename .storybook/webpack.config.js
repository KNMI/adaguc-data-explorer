module.exports = ({ config }) => {
  config.resolve.fallback = {
    fs: false,
    net: false,
  };
  return config;
};
