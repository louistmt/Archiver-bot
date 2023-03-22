import "dotenv/config"; // Load configuration variables into process.env
import * as url from "url";
import {Intents} from "discord.js";

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const intents = [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_WEBHOOKS
];

const paths = {
    data: process.env["DATA_DIRECTORY"],
    archiverState: process.env["DATA_DIRECTORY"] + "archiver-state.json",
    exporterState: process.env["DATA_DIRECTORY"] + "exporter-state.json",
    serversConfig: process.env["DATA_DIRECTORY"] + "servers-config.json"
};

const Config = {
    token: process.env["DISCORD_TOKEN"],
    clientId: process.env["CLIENT_ID"],
    clientOptions: {intents: intents},
    googleApiSecret: process.env["GOOGLE_API_SECRET"],
    googleApiClientId: process.env["GOOGLE_API_CLIENT_ID"],
    paths,
    categoryLimit: 50,
    archiveLimit: 500
};

export default Config;