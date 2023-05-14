import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionFlagsBits } from "discord-api-types/v10";
import { ChatInputCommandInteraction, CommandInteraction } from "discord.js";

import { Command, produceSubExecsMap } from "../../libs/cmds.mjs";
import { exportJsonDefinition, exportJsonExecute } from "./json.mjs";
import { exportWebPageDefinition, exportWebPageExecute } from "./webpage.mjs";

const subExecsMap = produceSubExecsMap(
    {definition: exportJsonDefinition, execute: exportJsonExecute},
    {definition: exportWebPageDefinition, execute: exportWebPageExecute}
);

const definition = new SlashCommandBuilder()
definition.setName("export")
definition.setDescription("Command used to export channels to some format")
definition.addSubcommand(exportJsonDefinition)
definition.addSubcommand(exportWebPageDefinition)
definition.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
definition.setDMPermission(false)

async function execute(interaction: ChatInputCommandInteraction) {
    await subExecsMap.get(interaction.options.getSubcommand())(interaction)
}

const exportCmd: Command = {definition, execute};
export default exportCmd;