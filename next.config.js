// Workaround for https://github.com/zeit/next.js/issues/1877
module.exports = {
  webpack: function(c) {
    if (c.resolve.alias) {
      delete c.resolve.alias["react"];
      delete c.resolve.alias["react-dom"];
    }
    return c;
  },
};
