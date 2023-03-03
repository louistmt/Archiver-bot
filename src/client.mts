import { Client } from "discord.js";
import Config from "./config.mjs";
import { preLogs } from "./utils.mjs";

const { log, error } = preLogs("Client");

const client = new Client(Config.clientOptions);
client.on("error", error);

client.once("ready", () => {
    log("Bot is online");
    client.user.setActivity("the servant", { type: "PLAYING" });
});
client.on("shardDisconnect", () => {
    log("Lost connection");
});
client.on("shardError", error);
client.on("shardReady", () => {
    log("Connection Ready");
});
client.on("shardReconnecting", () => {
    log("Reconnecting shard");
});
client.on("shardResume", () => {
    log("Connection resumed");
});

log("Starting up client");
await client.login(Config.token);

export default client;