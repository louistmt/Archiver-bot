import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import Job from "../../libs/worker-deprecated/Job.mjs";
import Exporter from "../../workers/exporter/exporter.mjs";
const exportJsonDefinition = new SlashCommandSubcommandBuilder();
exportJsonDefinition.setName("json");
exportJsonDefinition.setDescription("Exports a channel to another as a JSON file");
exportJsonDefinition.addChannelOption(option => option.setName("src-channel")
    .setDescription("The source of the messages")
    .setRequired(true));
exportJsonDefinition.addChannelOption(option => option.setName("dest-channel")
    .setDescription("The destination channel where the file will be posted")
    .setRequired(true));
async function exportJsonExecute(interaction) {
    const srcChannel = interaction.options.getChannel("src-channel");
    const srcChannelId = srcChannel.id;
    const srcChannelName = srcChannel.name;
    const destChannelId = interaction.options.getChannel("dest-channel").id;
    const job = Job.create(srcChannelName, {
        srcChannelId,
        srcChannelName,
        destChannelId
    }, "json");
    Exporter.enqueueJob(job);
    await interaction.reply(`Exporting ${srcChannelName} as a JSON file`);
}
export { exportJsonDefinition, exportJsonExecute };
