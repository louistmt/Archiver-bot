import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Command, produceSubExecsMap } from "../libs/cmds.mjs";

import Config from "../config.mjs";
import { retrieveArchiveData } from "../api/archival.mjs";
import { createChannel } from "../api/channels.mjs";
import { ServersConfigChest } from "../data/index.mjs";
import { PermissionFlagsBits, ChannelType } from "discord-api-types/v10.mjs";


const serversConfig = ServersConfigChest.get();

const catAddDefinition = new SlashCommandSubcommandBuilder()
catAddDefinition.setName("add")
catAddDefinition.setDescription("Adds a category to the archive server with the specified name")
catAddDefinition.addStringOption(option =>
    option.setName("name")
        .setDescription("The name of the category")
        .setRequired(true))

async function executeCatAdd(interaction: CommandInteraction) {
    const categoryName = interaction.options.getString("name")
    const serverId = interaction.guildId
    const { archiveServerId, logChannelId } = serversConfig.getOrCreate(serverId);


    if (archiveServerId.length === 0 || logChannelId.length === 0) {
        await interaction.reply(`Couldn't add category. Archive server is not yet configured.`);
        return;
    }

    const archiveServer = await retrieveArchiveData(archiveServerId);

    if (archiveServer.channelCount >= Config.archiveLimit) {
        await interaction.reply(`Archive server is full. Delete some channels or change archive server.`)
        return;
    }

    if (archiveServer.catNamesIds.has(categoryName)) {
        await interaction.reply(`Category ${categoryName} already exists.`);
        return;
    }

    await createChannel(archiveServerId, categoryName, ChannelType.GuildCategory);
    await interaction.reply(`Created new category \`\`${categoryName}\`\``);
}

const catListDefinition = new SlashCommandSubcommandBuilder()
catListDefinition.setName("list")
catListDefinition.setDescription("Sends info regarding the archive server")

async function executeCatList(interaction: CommandInteraction) {
    const serverId = interaction.guildId
    const { archiveServerId } = serversConfig.getOrCreate(serverId);

    if (archiveServerId.length === 0) {
        await interaction.reply(`Couldn't check archive status. Archive server is not yet configured.`);
        return;
    }

    const archiveServer = await retrieveArchiveData(archiveServerId);
    let reply = "**Archive Status**\n_ _\n_ _\n";

    reply += `\`\`Archive Capacity: ${archiveServer.channelCount}/${Config.archiveLimit} channels\`\`\n\n`;

    for (let [category, channels] of archiveServer.categories) {
        reply += `\`\`${category} Capacity: ${channels.length}/${Config.categoryLimit} channels\`\`\n`;
    }

    await interaction.reply(reply);
}

const subExecsMap = produceSubExecsMap(
    { definition: catAddDefinition, execute: executeCatAdd },
    { definition: catListDefinition, execute: executeCatList }
)

const definition = new SlashCommandBuilder();
definition.setName("category")
definition.setDescription("Commands to manipulate categories of the archive server")
definition.addSubcommand(catAddDefinition)
definition.addSubcommand(catListDefinition)
definition.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
definition.setDMPermission(false)

async function execute(interaction: CommandInteraction) {
    await subExecsMap.get(interaction.options.getSubcommand())(interaction)
}

const catCmd: Command = { definition, execute };
export default catCmd;