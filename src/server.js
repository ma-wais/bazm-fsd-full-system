import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const port = process.env.PORT || 5000;

async function start() {
  await connectDB();
  const app = createApp();

  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
