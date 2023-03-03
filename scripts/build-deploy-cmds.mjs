import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

import {definitionsList} from "../build/commands/index.mjs";
import Config from "../build/config.mjs";


const commands = [];

console.log("Deploying commands");

for (let definition of definitionsList) {
    commands.push(definition.toJSON());
}

console.log("Commands");
console.log(commands);

const rest = new REST({ version: '10' }).setToken(Config.token);

try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
        Routes.applicationCommands(Config.clientId),
        { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    process.exit(0);
} catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
}