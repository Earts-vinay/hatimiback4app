const { Redis } = require("ioredis");
require("dotenv").config();

const redisConfig = {
  port: process.env.REDIS_PORT || 6379,
  host: process.env.REDIS_HOST || "localhost",
};

const client = new Redis(redisConfig);

client.on("error", (err) => {
  console.error(`Redis Error: ${err}`);
  // Log to a dedicated logging system in production
});

client.on("connect", () => {
  console.log("Connected to Redis");
  // Additional setup or application logic
});

client.on("ready", () => {
  console.log("Client connected to Redis and ready to use...");
});

client.on("end", () => {
  console.log("Connection to Redis closed");
});

process.on("SIGINT", () => {
  client.quit();
});

module.exports = client;
