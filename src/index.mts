import { Client } from "discord.js";
import Archiver from "./workers/archiver.mjs";
import Config from "./config.mjs";
import { execsMap } from "./commands/index.mjs";
import { singleCallFix, preLogs } from "./utils.mjs";
import ServersConfigChest from "./data/server-config.mjs";


let client: Client = undefined
const {log, error} = preLogs("Client");

// Logging unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    error("Unhandled promise Rejection. Shutting down.");
    error(reason);
    shutdown()
});

// Logging unhandled exception and exiting gracefully as per Node documentation recommendations
process.on("uncaughtException", (err, origin) => {
    error("Unhandled error. Shutting down.");
    error(origin);
    error(err);
    shutdown()
});

// Despite how it looks, this is working. Handles termination via ctrl + c
process.on("SIGINT", singleCallFix(() => {
    log("Bot is exiting");
    shutdown();
}));

startup();

async function shutdown() {
    await Archiver.shutdown();
    Archiver.save(Config.paths.archiverState)
    ServersConfigChest.save()
    
    if (client != undefined) {
        client.destroy();
        client = undefined;
    }
    process.exit(0);
}

function startup() {
    if (client !== undefined) return;

    log("Starting up client");

    client = new Client(Config.clientOptions);
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

    client.on("interactionCreate", async interaction => {
        if (!interaction.isCommand()) return;
        const execute = execsMap.get(interaction.commandName)

        if (!execute) error(`Received command interaciton ${interaction.commandName} but there is no command to handle it`)

        log(`Handling command interaction ${interaction.commandName}`)

        try {
            await execute(interaction)
        } catch (err) {
            error(`Error while handling interaction for command ${interaction.commandName}`);
            error(err)
            await interaction.reply(`There was an error while handling this command.`)
        }
    });

    client.on("error", error);

    client.once("ready", () => {
        log("Bot is online");
        client.user.setActivity("the role of a slave", {type: "PLAYING"});
    });

    client.login(Config.token);
}