import client from "./services/client.mjs"
import Tasker from "./services/tasker/implementation.mjs"

import Config from "./config.mjs"
import { execsMap } from "./commands/index.mjs"
import { singleCallFix, preLogs, tryReplyError } from "./utils.mjs"


const {log, error} = preLogs("Client");

// Logging unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    error("Unhandled promise Rejection. Shutting down.")
    error(reason)
    shutdown()
});

// Logging unhandled exception and exiting gracefully as per Node documentation recommendations
process.on("uncaughtException", (err, origin) => {
    error("Unhandled error. Shutting down.")
    error(origin)
    error(err)
    shutdown()
});

// Despite how it looks, this is working. Handles termination via ctrl + c
process.on("SIGINT", singleCallFix(() => {
    log("Bot is exiting")
    shutdown()
}));

async function shutdown() {
    await Tasker.stop()
    client.destroy()
    client.emit("exit")
}

export default async function startup() {
    client.on("interactionCreate", async interaction => {
        if (!interaction.isCommand()) return
        const execute = execsMap.get(interaction.commandName)

        if (!execute) error(`Received command interaciton ${interaction.commandName} but there is no command to handle it`)

        log(`Handling command interaction ${interaction.commandName}`)

        try {
            await execute(interaction)
        } catch (err) {
            error(`Error while handling interaction for command ${interaction.commandName}`)
            error(err)
            tryReplyError(interaction, err)
        }
    })

    log("Starting up client")
    await client.login(Config.token)
    Tasker.start()
}