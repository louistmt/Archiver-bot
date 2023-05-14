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
    sqlite3: process.env["DATA_DIRECTORY"] + "db.sqlite3"
};

const Config = {
    token: process.env["DISCORD_TOKEN"],
    clientId: process.env["CLIENT_ID"],
    clientOptions: {intents: intents},
    googleScriptId: process.env["GOOGLE_SCRIPT_ID"],
    paths,
    categoryLimit: 50,
    archiveLimit: 500
};

export default Config;