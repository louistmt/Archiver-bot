import { ActivityType, Client } from "discord.js"
import Config from "../config.mjs"
import { preLogs } from "../utils.mjs"

const { log, error } = preLogs("Client")

const client = new Client(Config.clientOptions)
client.token = Config.token
client.on("error", (err) => {
    error(err)
    client.emit("exit")
})

client.once("ready", () => {
    log("Bot is online")
    client.user.setActivity("the servant", { type: ActivityType.Playing })
})
client.on("shardDisconnect", () => {
    log("Lost connection")
})
client.on("shardError", error)
client.on("shardReady", () => {
    log("Connection Ready")
})
client.on("shardReconnecting", () => {
    log("Reconnecting shard")
})
client.on("shardResume", () => {
    log("Connection resumed")
})

export default client