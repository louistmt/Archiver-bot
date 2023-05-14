import "dotenv/config"; // Load configuration variables into process.env
import * as url from "url";
import {GatewayIntentBits} from "discord.js";

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
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