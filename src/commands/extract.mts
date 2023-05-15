import { SlashCommandBuilder } from "@discordjs/builders"
import { PermissionFlagsBits } from "discord-api-types/v9"
import { AttachmentBuilder, ChatInputCommandInteraction } from "discord.js"
import { Command } from "../libs/cmds.mjs"
import { capitalize } from "../utils.mjs"
import { retrieveMessagesRange } from "../services/archival.mjs"


const definition = new SlashCommandBuilder()
definition.setName("extract")
definition.setDescription("Extract a portion of a channel into json and webpage format")
definition.addStringOption(
    option => option.setName("start")
                    .setDescription("Id of the message it should start extracting from (inclusive)")
                    .setRequired(true)
)
definition.addStringOption(
    option => option.setName("stop")
                    .setDescription("Id of the message it should stop at (inclusive)")
                    .setRequired(true)
)
definition.setDMPermission(false)
definition.setDefaultMemberPermissions(PermissionFlagsBits.ReadMessageHistory)

const discordCdnUrl = "https://cdn.discordapp.com/attachments/"
const replitUrl = "https://archiver-viewer.luisferreira.repl.co/viewer"

async function execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.user
    const channel = interaction.channel
    const name = capitalize(channel.name.replaceAll("-", " "))
    const startId = interaction.options.getString("start")
    const endId = interaction.options.getString("stop")

    await interaction.reply({content: "One moment while I work on your request.", ephemeral: true})

    const messages = await retrieveMessagesRange(channel.id, startId, endId)

    if (messages.length === 0) {
        await user.send("Sorry but I was unable to find what you asked. Make sure you have typed the correct start and stop")
        return
    }

    const json = {name, messages}
    const jsonBuffer = Buffer.from(JSON.stringify(json))
    const attachment = new AttachmentBuilder(jsonBuffer)
    attachment.setName(`${channel.name.replaceAll("-", " ")}.json`)

    const msg = await user.send({files: [attachment]})
    const fileUrl = [...msg.attachments.values()][0].url.replace(discordCdnUrl, "")
    await user.send(`${replitUrl}/${fileUrl}`)
}

const extractCmd: Command = {definition, execute}
export default extractCmd