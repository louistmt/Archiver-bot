import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionFlagsBits } from "discord-api-types/v9";
import { ChatInputCommandInteraction } from "discord.js";
import { Command } from "../libs/cmds.mjs";
import Archiver from "../services/archiver.mjs";

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

async function execute(interaction: ChatInputCommandInteraction) {
    const channelId = interaction.options.getChannel("channel").id
    await Archiver.dequeue(`archive-${channelId}`)
    await interaction.reply(`Canceled job.`)
}

const cancelCmd: Command = {definition, execute};
export default cancelCmd;