import { SlashCommandBuilder } from "@discordjs/builders";
import { multiline } from "../utils.mjs";
const definition = new SlashCommandBuilder();
definition.setName("roll");
definition.setDescription("Rolls a dice. You can choose whether everyone sees it or not");
definition.addStringOption(option => option.setName("dice")
    .setDescription("The dice to roll. Example: 2d10+3 rolls 2 dice from 1 to 10 and adds 3 to the of each")
    .setRequired(true));
definition.addBooleanOption(option => option.setName("public")
    .setDescription("Whether you or everyone can see it.")
    .setRequired(false));
definition.setDMPermission(true);
const diceRgx = /([1-9][0-9]*)d([1-9][0-9]*)(\+([1-9][0-9]*))?/m;
async function execute(interaction) {
    const dice = interaction.options.getString("dice");
    const isPublic = Boolean(interaction.options.getBoolean("public", false));
    const matches = dice.match(diceRgx);
    if (matches === null) {
        await interaction.reply({ ephemeral: true, content: multiline("Invalid dice format. Valid examples:", "- '1d6': Rolls a single 6 die", "- '2d6': Rolls two 6 dice", "- '2d6+3': Rolls two 6 die and adds 3 to the result of each die") });
        return;
    }
    const [, countStr, dieStr, , sumStr = "0"] = matches;
    const result = [];
    const count = parseInt(countStr);
    const die = parseInt(dieStr);
    const sum = parseInt(sumStr);
    for (let i = 0; i < count; i++) {
        result.push(Math.floor(Math.random() * die) + 1 + sum);
    }
    const response = `Here are the results: \`\`${result.sort().reverse().join(", ")}\`\``;
    if (response.length <= 2000) {
        await interaction.reply({
            content: `Here are the results: \`\`${result.join(", ")}\`\``,
            ephemeral: !isPublic
        });
    }
    else {
        await interaction.reply({
            content: "The response goes over 2000 characters. Choose lower values",
            ephemeral: true
        });
    }
}
const rollCmd = { definition, execute };
export default rollCmd;
