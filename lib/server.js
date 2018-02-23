const { createServer } = require("http");
const { matchesUA } = require("browserslist-useragent");
const { parse } = require("url");
const next = require("next");

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    if (matchesUA(req.headers["user-agent"], {
        _allowHigherVersions: true
      })) {
      return handle(req, res, parse(req.url, true));
    } else {
      return app.render(req, res, "/upgrade", req.query);
    }
  }).listen(port, err => {
    if (err) throw err;
    console.log("> Ready on http://localhost:3000");
  });
});
