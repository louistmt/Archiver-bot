import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction } from "discord.js";
import Exporter from "../../services/exporter.mjs";


const exportTextDefinition = new SlashCommandSubcommandBuilder()
exportTextDefinition.setName("text")
exportTextDefinition.setDescription("Exports a channel to another as a text file")
exportTextDefinition.addChannelOption(
    option => option.setName("src-channel")
                    .setDescription("The source of the messages")
                    .setRequired(true)
)
exportTextDefinition.addChannelOption(
    option => option.setName("dest-channel")
                    .setDescription("The destination channel where the file will be posted")
                    .setRequired(true)
)

async function exportTextExecute(interaction: ChatInputCommandInteraction) {
    const srcChannel = interaction.options.getChannel("src-channel")
    const srcChannelId = srcChannel.id
    const srcChannelName = srcChannel.name
    const destChannelId = interaction.options.getChannel("dest-channel").id
    
    await Exporter.queue(`export-${srcChannelId}`, {format: "text", srcChannelId, srcChannelName, destChannelId})
    await interaction.reply(`Exporting ${srcChannelName} as a text file`)
}

export {exportTextDefinition, exportTextExecute}