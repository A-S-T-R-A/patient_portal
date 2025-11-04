/* Next.js custom server with built-in Socket.IO RT Gateway */
const http = require("http");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

async function start() {
  await app.prepare();
  const server = http.createServer((req, res) => handle(req, res));

  // RT (Socket.IO) Gateway поверх того же HTTP-сервера
  const { initRtGateway } = require("./server/rt/gateway");
  initRtGateway(server);

  const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(
      `Admin (Next + Socket.IO RT Gateway) listening on http://localhost:${PORT}`
    );
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
