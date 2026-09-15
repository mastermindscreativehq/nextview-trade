import { buildApp, parseEnv } from "./app.js";

async function start() {
  const env = parseEnv();
  const server = await buildApp({ env });

  try {
    await server.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

void start();