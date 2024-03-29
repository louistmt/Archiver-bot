import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionFlagsBits } from "discord-api-types/v10";
import { ChatInputCommandInteraction } from "discord.js";

import { Command, produceSubExecsMap } from "../../libs/cmds.mjs";
import { configArchiveDefinition, configArchiveExecute } from "./archive-server.mjs";
import { configLogChannelDefinition, configLogChannelExecute } from "./log-channel.mjs";
import { listDefinition, listExecute } from "./list.mjs";


const subExecsMap = produceSubExecsMap(
    {definition: configArchiveDefinition, execute: configArchiveExecute},
    {definition: configLogChannelDefinition, execute: configLogChannelExecute},
    {definition: listDefinition, execute: listExecute}
)

const definition = new SlashCommandBuilder()
definition.setName("config")
definition.setDescription("Command used to configure the bot")
definition.addSubcommand(configArchiveDefinition)
definition.addSubcommand(configLogChannelDefinition)
definition.addSubcommand(listDefinition)
definition.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
definition.setDMPermission(false)

async function execute(interaction: ChatInputCommandInteraction) {
    await subExecsMap.get(interaction.options.getSubcommand())(interaction)
}

const configCmd: Command = {definition, execute};
export default configCmd;