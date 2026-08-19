const http = require("node:http");
const os = require("node:os");

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: ${process.env.PORT}`);
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(`${JSON.stringify(body, null, 2)}\n`);
}

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

  if (pathname === "/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (pathname === "/") {
    sendJson(response, 200, {
      service: "hello-deploy",
      environment: process.env.APP_ENV ?? "development",
      message: process.env.APP_MESSAGE ?? "Hello",
      version: process.env.APP_VERSION ?? "dev",
      secretConfigured: Boolean(process.env.DEMO_SECRET),
      hostname: os.hostname(),
      time: new Date().toISOString(),
    });
    return;
  }

  sendJson(response, 404, { error: "Not Found" });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`hello-deploy listening on 0.0.0.0:${port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }

    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
