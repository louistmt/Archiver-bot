import Tasker from "./tasker.mjs";
import { retrieveAllMessages } from "./archival.mjs";
import { capitalize } from "../utils.mjs";
import { AttachmentBuilder } from "discord.js";
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
    const attachment = new AttachmentBuilder(jsonBuffer);
    attachment.setName(`${srcChannelName.replaceAll("-", " ")}.json`);
    const destChannel = await client.channels.fetch(destChannelId);
    const srcChannel = await client.channels.fetch(srcChannelId);
    if (destChannel.isTextBased()) {
        const msg = await destChannel.send({ files: [attachment] });
        if (format === "webpage") {
            const fileUrl = [...msg.attachments.values()][0].url.replace(discordCdnUrl, "");
            await destChannel.send(`${replitUrl}/${fileUrl}`);
        }
    }
    else {
        throw Error(`Channel ${destChannel.name} is not a text channel`);
    }
    await srcChannel.send(`Channel exported. You may now delete it if you wish`);
}
Tasker.addTaskHandlers(exportTask);
async function queue(id, data) {
    await Tasker.addJob(id, `Export ${data.srcChannelName}`, [[exportTask, data]]);
}
async function dequeue(id) {
    await Tasker.removeJob(id);
}
async function getTaskCountFor(jobId, task) {
    return (await Tasker.getTasksFor(jobId, task)).length;
}
const Exporter = {
    queue,
    dequeue,
    getTaskCountFor
};
export default Exporter;
