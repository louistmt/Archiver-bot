import Exporter from "../services/exporter.mjs"
import { SlashCommandBuilder } from "@discordjs/builders"
import { ChannelType, PermissionFlagsBits } from "discord-api-types/v10"
import type { ChatInputCommandInteraction, GuildBasedChannel } from "discord.js"
import { Command } from "../libs/cmds.mjs"
import { retrieveServerInfo } from "../services/archival.mjs"


const definition = new SlashCommandBuilder()
definition.setName("export-category")
definition.setDescription("Exports a whole category of channels as web pages into a destination channel")
definition.setDMPermission(false)
definition.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
definition.addChannelOption((option) => {
    option.setName("src-category")
    option.setDescription("The category that will be exported")
    option.setRequired(true)
    return option
})
definition.addChannelOption((option) => {
    option.setName("dest-channel")
    option.setDescription("The destination channel for the web pages")
    option.setRequired(true)
    return option
})


async function execute(interaction: ChatInputCommandInteraction) {

    const category = interaction.options.getChannel("src-category") as GuildBasedChannel
    if (category.type !== ChannelType.GuildCategory) {
        await interaction.reply(`Channel ${(category as GuildBasedChannel).name} is not a category`)
        return
    }

    const destChannel = interaction.options.getChannel("dest-channel") as GuildBasedChannel
    if (!destChannel.isTextBased()) {
        await interaction.reply(`Channel ${(destChannel as GuildBasedChannel).name} is not a text channel`)
        return;   
    }

    const guildId = interaction.guildId
    const serverInfo = await retrieveServerInfo(guildId)
    const srcChannels = serverInfo.catTextChannels.get(category.id)

    for (let {id, name} of srcChannels) {
        await Exporter.queue(`export-${id}`, {format: "webpage", srcChannelId: id, srcChannelName: name, destChannelId: destChannel.id})
    }
    
    await interaction.reply(`Queued ${srcChannels.length} to be exported`)
}

const exportCatCmd: Command = { definition, execute }
export default exportCatCmd;