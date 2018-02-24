const withCSS = require("@zeit/next-css");
const path = require("path");

// Workaround for https://github.com/zeit/next.js/issues/1877
module.exports = withCSS({
  webpack: function(c) {
    if (c.resolve.alias) {
      delete c.resolve.alias["react"];
      delete c.resolve.alias["react-dom"];
    } else {
      c.resolve.alias = {};
    }

    return c;
  },
});
