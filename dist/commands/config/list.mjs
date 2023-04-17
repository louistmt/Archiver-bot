import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { ServersConfig } from "../../services/database.mjs";
import { multiline } from "../../utils.mjs";
const listDefinition = new SlashCommandSubcommandBuilder();
listDefinition.setName("list");
listDefinition.setDescription("Lists the current configurations of this bot for this server");
async function listExecute(interaction) {
    const defaultConfig = {
        archiveServerId: "",
        logChannelId: ""
    };
    const [config] = await ServersConfig.findOrCreate({ where: { serverId: interaction.guildId }, defaults: defaultConfig });
    await interaction.reply(multiline("```", "Server Configuration", "", `Archiver Server Id: ${config.archiveServerId}`, `Log Channel Id: ${config.logChannelId}`, "```"));
}
export { listDefinition, listExecute };
