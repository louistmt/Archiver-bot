import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { PermissionFlagsBits } from "discord-api-types/v10";
import { ServersConfig } from "../../services/database.mjs";
const configArchiveDefinition = new SlashCommandSubcommandBuilder();
configArchiveDefinition.setName("archive-server");
configArchiveDefinition.setDescription("Configures the server that will be used for as an archive");
configArchiveDefinition.addStringOption(option => option.setName("server-id")
    .setDescription("The id of the archive server")
    .setRequired(true));
async function configArchiveExecute(interaction) {
    const guildId = interaction.options.getString("server-id");
    const userId = interaction.member.user.id;
    const defaultConfig = {
        archiveServerId: "",
        logChannelId: ""
    };
    const [config] = await ServersConfig.findOrCreate({ where: { serverId: interaction.guildId }, defaults: defaultConfig });
    // Check if we have access to the archive server
    const guild = interaction.client.guilds.cache.get(guildId);
    if (!guild) {
        await interaction.reply(`The bot does not have access to the provided server id \`\`${guildId}\`\`.`);
        return;
    }
    // Check if the command issuer has admin permissions in the archive server
    try {
        const member = await guild.members.fetch(userId);
        if (!member.permissions.has(PermissionFlagsBits.Administrator))
            throw `No admin perms`;
    }
    catch (err) {
        await interaction.reply(`You don't have admin permissions in the provided server id. \`\`${guildId}\`\``);
        return;
    }
    config.archiveServerId = guildId;
    await config.save();
    await interaction.reply("Archive server has been set.");
}
export { configArchiveDefinition, configArchiveExecute };
