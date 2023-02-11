import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { PermissionFlagsBits, Routes } from "discord-api-types/v9";
import { CommandInteraction } from "discord.js";

import { Command, produceSubExecsMap } from "../libs/cmds.mjs";
import { ServersConfigChest } from "../data/index.mjs";
import Config from "../config.mjs";


const rest = new REST({ version: '9' }).setToken(Config.token);
const serversConfig = ServersConfigChest.get();

const configArchiveDefinition = new SlashCommandSubcommandBuilder()
configArchiveDefinition.setName("archive-server")
configArchiveDefinition.setDescription("Configures the server that will be used for as an archive")
configArchiveDefinition.addStringOption(
    option => option.setName("server-id")
                    .setDescription("The id of the archive server")
                    .setRequired(true)
)

async function configArchiveExecute(interaction: CommandInteraction) {
    const guildId = interaction.options.getString("server-id");
    const config = serversConfig.getOrCreate(interaction.guildId)

    try {
        await rest.get(Routes.guild(guildId));
    } catch (err) {
        await interaction.reply(`The bot does not have access to the provided server id \`\`${guildId}\`\`.`);
        return;
    }

    config.archiveServerId = guildId
    await interaction.reply("Archive server has been set.");
}

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

const subExecsMap = produceSubExecsMap(
    {definition: configArchiveDefinition, execute: configArchiveExecute},
    {definition: configLogChannelDefinition, execute: configLogChannelExecute}
)

const definition = new SlashCommandBuilder()
definition.setName("config")
definition.setDescription("Command used to configure the bot")
definition.addSubcommand(configArchiveDefinition)
definition.addSubcommand(configLogChannelDefinition)
definition.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
definition.setDMPermission(false)

async function execute(interaction: CommandInteraction) {
    await subExecsMap.get(interaction.options.getSubcommand())(interaction)
}

const configCmd: Command = {definition, execute};
export default configCmd;