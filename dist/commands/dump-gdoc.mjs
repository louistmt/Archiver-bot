import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionFlagsBits } from "discord-api-types/v9";
import Config from "../config.mjs";
import fetch from "node-fetch";
import { delay } from "../utils.mjs";
import { postMessage } from "../api/channels.mjs";
const googleScriptUrl = `https://script.google.com/macros/s/${Config.googleScriptId}/exec`;
const definition = new SlashCommandBuilder();
definition.setName("dump-gdoc");
definition.setDescription("Dump a google doc into discord as multiple messages");
definition.addStringOption(option => option.setName("doc-url")
    .setDescription("The url to the google doc you wish to dump")
    .setRequired(true));
definition.setDMPermission(true);
definition.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages);
//https://docs.google.com/document/d/1BcsKcwinO_JlGIIeazh25ljHdVWl8VJvEn12pFjB7Dg/edit?usp=sharing
//https://docs.google.com/document/d/1b9ptvcg9nO2JzK25H0mjgnu0AofLUYgoKBhI5oSfOF0/edit?usp=sharing
const editRegex = /\/edit\?.*/gm;
function extractDocIdFromUrl(docUrl) {
    return docUrl.replace("https://docs.google.com/document/d/", "").replace(editRegex, "");
}
async function execute(interaction) {
    const docUrl = interaction.options.getString("doc-url");
    const channelId = interaction.channelId;
    const docId = extractDocIdFromUrl(docUrl);
    const response = await fetch(`${googleScriptUrl}?docId=${docId}`);
    if (!response.ok) {
        await interaction.reply(response.statusText);
        return;
    }
    await interaction.reply({ ephemeral: true, content: "I found the document. Give me a little to dump it all" });
    const messages = await response.json();
    for (let msg of messages) {
        await delay(3 * 1000);
        await postMessage(channelId, msg);
    }
}
const dumpGDocCmd = { definition, execute };
export default dumpGDocCmd;
