import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { REST } from "@discordjs/rest";
import { PermissionFlagsBits, Routes } from "discord-api-types/v10";

import { ServersConfigChest } from "../../data/index.mjs";
import Config from "../../config.mjs";


const serversConfig = ServersConfigChest.get();
const rest = new REST({ version: '10' }).setToken(Config.token);

const configLogChannelDefinition = new SlashCommandSubcommandBuilder()
configLogChannelDefinition.setName("log-channel")
configLogChannelDefinition.setDescription("Sets the log channel for the bot")
configLogChannelDefinition.addStringOption(
    option => option.setName("channel")
                    .setDescription("The channel that will be used for logging")
                    .setRequired(true)
)

async function configLogChannelExecute(interaction: CommandInteraction) {
    const channelId = interaction.options.getString("channel")
    const config = serversConfig.getOrCreate(interaction.guildId)

    try {
        await rest.get(Routes.channel(channelId));
    } catch (err) {
        await interaction.reply(`The bot does not have access to the given channel.`);
        return;
    }

    config.logChannelId = channelId;
    await interaction.reply("Log channel has been set.");
}

export {configLogChannelDefinition, configLogChannelExecute};