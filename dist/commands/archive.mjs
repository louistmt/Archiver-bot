import { getChannel } from "../api-deprecated/channels.mjs";
import { ServersConfig } from "../services/database.mjs";
import Archiver from "../services/archiver.mjs";
import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionFlagsBits } from "discord-api-types/v10";
import { preLogs } from "../utils.mjs";
import { retrieveArchiveData } from "../api-deprecated/archival.mjs";
const { log } = preLogs("Archive");
const definition = new SlashCommandBuilder();
definition.setName("archive")
    .setDescription("Archives a rp channel into the archive server")
    .addChannelOption(option => option.setName("channel")
    .setDescription("The rp channel to archive")
    .setRequired(true))
    .addStringOption(option => option.setName("category")
    .setDescription("The category to put the channel into")
    .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false);
async function execute(interaction) {
    log("Received interaction");
    const srcServerId = interaction.guildId;
    const srcChannelId = interaction.options.getChannel("channel").id;
    const srcChannelName = (await getChannel(srcChannelId)).name;
    const destCategoryName = interaction.options.getString("category");
    const defaultConfig = {
        archiveServerId: "",
        logChannelId: ""
    };
    const [config] = await ServersConfig.findOrCreate({ where: { serverId: srcServerId }, defaults: defaultConfig });
    let { archiveServerId, logChannelId } = config;
    if (archiveServerId.length === 0 || logChannelId.length === 0) {
        await interaction.reply(`Couldn't queue ${srcChannelName} for archive. Archive server is not yet configured.`);
        return;
    }
    const { catNamesIds } = await retrieveArchiveData(archiveServerId);
    if (!catNamesIds.has(destCategoryName)) {
        await interaction.reply(`Couldn't queue ${srcChannelName} for archive. The category '${destCategoryName}' does not exist`);
        return;
    }
    await Archiver.queue(`archive-${srcChannelId}`, { srcChannelId, srcChannelName, destServerId: archiveServerId, destCategoryName });
    await interaction.reply(`Queueing ${srcChannelName} for archive in \`\`${destCategoryName}\`\``);
}
const archiveCmd = { definition, execute };
export default archiveCmd;
