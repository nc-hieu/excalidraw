import dotenv from "dotenv";
import { buildApp } from "./app.js";

dotenv.config();

const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST || "0.0.0.0";

const start = async () => {
  const app = await buildApp();

  try {
    await app.listen({ port, host });
    console.log(`🚀 Excalidraw Backend Server running at http://${host}:${port}`);
    console.log(`📡 Health check: http://${host}:${port}/health`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
