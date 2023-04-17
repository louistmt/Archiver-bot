import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { ServersConfig } from "../../services/database.mjs";
import Config from "../../config.mjs";
const rest = new REST({ version: '10' }).setToken(Config.token);
const configLogChannelDefinition = new SlashCommandSubcommandBuilder();
configLogChannelDefinition.setName("log-channel");
configLogChannelDefinition.setDescription("Sets the log channel for the bot");
configLogChannelDefinition.addStringOption(option => option.setName("channel")
    .setDescription("The channel that will be used for logging")
    .setRequired(true));
async function configLogChannelExecute(interaction) {
    const channelId = interaction.options.getString("channel");
    const defaultConfig = {
        archiveServerId: "",
        logChannelId: ""
    };
    const [config] = await ServersConfig.findOrCreate({ where: { serverId: interaction.guildId }, defaults: defaultConfig });
    try {
        await rest.get(Routes.channel(channelId));
    }
    catch (err) {
        await interaction.reply(`The bot does not have access to the given channel.`);
        return;
    }
    config.logChannelId = channelId;
    await config.save();
    await interaction.reply("Log channel has been set.");
}
export { configLogChannelDefinition, configLogChannelExecute };
