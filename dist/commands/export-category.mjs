import Exporter from "../services/exporter.mjs";
import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionFlagsBits } from "discord-api-types/v9";
import { retrieveServerInfo } from "../api-deprecated/archival.mjs";
const definition = new SlashCommandBuilder();
definition.setName("export-category");
definition.setDescription("Exports a whole category of channels as web pages into a destination channel");
definition.setDMPermission(false);
definition.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
definition.addChannelOption((option) => {
    option.setName("src-category");
    option.setDescription("The category that will be exported");
    option.setRequired(true);
    return option;
});
definition.addChannelOption((option) => {
    option.setName("dest-channel");
    option.setDescription("The destination channel for the web pages");
    option.setRequired(true);
    return option;
});
async function execute(interaction) {
    const category = interaction.options.getChannel("src-category");
    if (category.type !== "GUILD_CATEGORY") {
        await interaction.reply(`Channel ${category.name} is not a category`);
        return;
    }
    const destChannel = interaction.options.getChannel("dest-channel");
    if (!destChannel.isText()) {
        await interaction.reply(`Channel ${destChannel.name} is not a text channel`);
        return;
    }
    const guildId = interaction.guildId;
    const serverInfo = await retrieveServerInfo(guildId);
    const srcChannels = serverInfo.catTextChannels.get(category.id);
    for (let { id, name } of srcChannels) {
        await Exporter.queue(`export-${id}`, { format: "webpage", srcChannelId: id, srcChannelName: name, destChannelId: destChannel.id });
    }
    await interaction.reply(`Queued ${srcChannels.length} to be exported`);
}
const exportCatCmd = { definition, execute };
export default exportCatCmd;
