import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

import { ServersConfigChest } from "../../data/index.mjs";
import { multiline } from "../../utils.mjs";


const serversConfig = ServersConfigChest.get();

const listDefinition = new SlashCommandSubcommandBuilder()
listDefinition.setName("list")
listDefinition.setDescription("Lists the current configurations of this bot for this server")

async function listExecute(interaction: CommandInteraction) {
    const config = serversConfig.getOrCreate(interaction.guildId)

    await interaction.reply(multiline(
        "```",
        "Server Configuration",
        "",
        `Archiver Server Id: ${config.archiveServerId}`,
        `Log Channel Id: ${config.logChannelId}`,
        "```"
    ))
}

export {listDefinition, listExecute};