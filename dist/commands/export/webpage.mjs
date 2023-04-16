import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import Job from "../../libs/worker-deprecated/Job.mjs";
import Exporter from "../../workers/exporter/exporter.mjs";
const exportWebPageDefinition = new SlashCommandSubcommandBuilder();
exportWebPageDefinition.setName("webpage");
exportWebPageDefinition.setDescription("Exports a channel to another as a viewable link");
exportWebPageDefinition.addChannelOption(option => option.setName("src-channel")
    .setDescription("The source of the messages")
    .setRequired(true));
exportWebPageDefinition.addChannelOption(option => option.setName("dest-channel")
    .setDescription("The destination channel where the file will be posted")
    .setRequired(true));
async function exportWebPageExecute(interaction) {
    const srcChannel = interaction.options.getChannel("src-channel");
    const srcChannelId = srcChannel.id;
    const srcChannelName = srcChannel.name;
    const destChannelId = interaction.options.getChannel("dest-channel").id;
    const job = Job.create(srcChannelName, {
        srcChannelId,
        srcChannelName,
        destChannelId
    }, "webpage");
    Exporter.enqueueJob(job);
    await interaction.reply(`Exporting ${srcChannelName} as a viewable link`);
}
export { exportWebPageDefinition, exportWebPageExecute };
