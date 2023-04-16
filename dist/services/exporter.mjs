import Tasker from "./tasker.mjs";
import { retrieveAllMessages } from "../api/archival.mjs";
import { postMessage } from "../api/channels.mjs";
import { capitalize } from "../utils.mjs";
import { MessageAttachment } from "discord.js";
import client from "./client.mjs";
const discordCdnUrl = "https://cdn.discordapp.com/attachments/";
const replitUrl = "https://archiver-viewer.luisferreira.repl.co/viewer";
async function exportTask(jobId, data, tasker) {
    const { format, srcChannelId, srcChannelName, destChannelId } = data;
    const messages = await retrieveAllMessages(srcChannelId);
    const json = {
        "name": capitalize(srcChannelName.replaceAll("-", " ")),
        "messages": messages
    };
    const jsonBuffer = Buffer.from(JSON.stringify(json));
    const attachment = new MessageAttachment(jsonBuffer, `${srcChannelName.replaceAll("-", " ")}.json`);
    const channel = await client.channels.fetch(destChannelId);
    if (channel.isText()) {
        const msg = await channel.send({ files: [attachment] });
        if (format === "webpage") {
            const fileUrl = [...msg.attachments.values()][0].url.replace(discordCdnUrl, "");
            await channel.send(`${replitUrl}/${fileUrl}`);
        }
    }
    else {
        throw Error(`Channel ${channel.name} is not a text channel`);
    }
    await postMessage(srcChannelId, `Channel export. You may now delete it if you wish`);
}
Tasker.addTaskHandlers(exportTask);
async function queue(id, data) {
    await Tasker.addJob(id, `Export ${data.srcChannelName}`, [[exportTask, data]]);
}
async function dequeue(id) {
    await Tasker.removeJob(id);
}
async function getCountFor(jobId, task) {
    return (await Tasker.getTasksFor(jobId, task)).length;
}
const Exporter = {
    queue,
    dequeue,
    getCountFor
};
export default Exporter;
