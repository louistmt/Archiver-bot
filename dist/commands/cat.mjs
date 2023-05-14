import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { produceSubExecsMap } from "../libs/cmds.mjs";
import Config from "../config.mjs";
import { retrieveArchiveData } from "../api-deprecated/archival.mjs";
import { createChannel } from "../api-deprecated/channels.mjs";
import { ServersConfig } from "../services/database.mjs";
import { PermissionFlagsBits, ChannelType } from "discord-api-types/v10";
const catAddDefinition = new SlashCommandSubcommandBuilder();
catAddDefinition.setName("add");
catAddDefinition.setDescription("Adds a category to the archive server with the specified name");
catAddDefinition.addStringOption(option => option.setName("name")
    .setDescription("The name of the category")
    .setRequired(true));
async function executeCatAdd(interaction) {
    const categoryName = interaction.options.getString("name");
    const serverId = interaction.guildId;
    const defaultConfig = {
        archiveServerId: "",
        logChannelId: ""
    };
    const [config] = await ServersConfig.findOrCreate({ where: { serverId: interaction.guildId }, defaults: defaultConfig });
    let { archiveServerId } = config;
    if (archiveServerId.length === 0) {
        archiveServerId = serverId;
    }
    const archiveServer = await retrieveArchiveData(archiveServerId);
    if (archiveServer.channelCount >= Config.archiveLimit) {
        await interaction.reply(`Archive server is full. Delete some channels or change archive server.`);
        return;
    }
    if (archiveServer.catNamesIds.has(categoryName)) {
        await interaction.reply(`Category ${categoryName} already exists.`);
        return;
    }
    await createChannel(archiveServerId, categoryName, ChannelType.GuildCategory);
    await interaction.reply(`Created new category \`\`${categoryName}\`\``);
}
const catListDefinition = new SlashCommandSubcommandBuilder();
catListDefinition.setName("list");
catListDefinition.setDescription("Replies with info regarding the archive server");
async function executeCatList(interaction) {
    const serverId = interaction.guildId;
    const defaultConfig = {
        archiveServerId: "",
        logChannelId: ""
    };
    const [config] = await ServersConfig.findOrCreate({ where: { serverId: interaction.guildId }, defaults: defaultConfig });
    let { archiveServerId } = config;
    if (archiveServerId.length === 0) {
        archiveServerId = serverId;
    }
    const archiveServer = await retrieveArchiveData(archiveServerId);
    let reply = "**Archive Status**\n_ _\n_ _\n";
    reply += `\`\`Archive Capacity: ${archiveServer.channelCount}/${Config.archiveLimit} channels\`\`\n\n`;
    for (let [category, channels] of archiveServer.categories) {
        reply += `\`\`${category} Capacity: ${channels.length}/${Config.categoryLimit} channels\`\`\n`;
    }
    await interaction.reply(reply);
}
const subExecsMap = produceSubExecsMap({ definition: catAddDefinition, execute: executeCatAdd }, { definition: catListDefinition, execute: executeCatList });
const definition = new SlashCommandBuilder();
definition.setName("category");
definition.setDescription("Commands to manipulate categories of the archive server");
definition.addSubcommand(catAddDefinition);
definition.addSubcommand(catListDefinition);
definition.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
definition.setDMPermission(false);
async function execute(interaction) {
    await subExecsMap.get(interaction.options.getSubcommand())(interaction);
}
const catCmd = { definition, execute };
export default catCmd;
