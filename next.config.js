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

    // Hack dealing with the fact that npm is rejecting our pull-request-defined react-quill implementation. I spent enough time fighting with it; forcing for now.
    c.resolve.alias["react-quill"] = path.resolve(
      __dirname,
      "node_modules/react-quill",
    );
    return c;
  },
});
