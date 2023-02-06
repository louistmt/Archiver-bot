import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionFlagsBits } from "discord-api-types/v9";
import { CommandInteraction } from "discord.js";
import { Command } from "../libs/cmds.mjs";
import Archiver from "../workers/archiver.mjs";

const definition = new SlashCommandBuilder()
definition.setName("cancel")
definition.setDescription("Cancels archival jobs that may have been scheduled for this channel");
definition.addChannelOption(option =>
    option.setName("channel")
          .setDescription("The channel that was scheduled to be archived")
          .setRequired(true)
)
definition.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
definition.setDMPermission(false)

async function execute(interaction: CommandInteraction) {
    const jobs = Archiver.jobs;
    const channelId = interaction.options.getChannel("channel").id
    const jobsToCancel = jobs.filter((job) => job.data.srcChannelId === channelId && !job.isStateImmutable())

    jobsToCancel.forEach((job) => { job.cancel() })
    await interaction.reply(`Canceled ${jobsToCancel.length} jobs.`)
}

const cancelCmd: Command = {definition, execute};
export default cancelCmd;