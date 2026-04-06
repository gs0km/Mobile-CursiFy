const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url.startsWith("/api")) {
        const http = require("http");
        const options = {
          hostname: "localhost",
          port: 8080,
          path: req.url,
          method: req.method,
          headers: { ...req.headers, host: "localhost:8080" },
        };
        const proxy = http.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, {
            ...proxyRes.headers,
            "access-control-allow-origin": "*",
          });
          proxyRes.pipe(res, { end: true });
        });
        proxy.on("error", () => res.writeHead(502) && res.end());
        req.pipe(proxy, { end: true });
        return;
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
