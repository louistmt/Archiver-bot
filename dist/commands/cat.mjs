import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { produceSubExecsMap } from "../libs/cmds.mjs";
import Config from "../config.mjs";
import { ServersConfig } from "../services/database.mjs";
import { PermissionFlagsBits, ChannelType } from "discord-api-types/v10";
import { retrieveServerInfo } from "../services/archival.mjs";
import client from "../services/client.mjs";
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
    const archiveServer = await retrieveServerInfo(archiveServerId);
    if (archiveServer.channelCount >= Config.archiveLimit) {
        await interaction.reply(`Archive server is full. Delete some channels or change archive server.`);
        return;
    }
    if (archiveServer.catNamesIds.has(categoryName)) {
        await interaction.reply(`Category ${categoryName} already exists.`);
        return;
    }
    const archiveGuild = await client.guilds.fetch(archiveServerId);
    await archiveGuild.channels.create({ name: categoryName, type: ChannelType.GuildCategory });
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
    const archiveServer = await retrieveServerInfo(archiveServerId);
    let reply = "**Archive Status**\n_ _\n_ _\n";
    reply += `\`\`Archive Capacity: ${archiveServer.channelCount}/${Config.archiveLimit} channels\`\`\n\n`;
    for (let [name, id] of archiveServer.catNamesIds) {
        console.log(archiveServer.catTextChannels);
        const channels = archiveServer.catTextChannels.get(id);
        reply += `\`\`${name} Capacity: ${channels.length}/${Config.categoryLimit} channels\`\`\n`;
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
