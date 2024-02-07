import Tasker from "./tasker/implementation.mjs";
import { retrieveAllMessages } from "./archival.mjs";
import { capitalize } from "../utils.mjs";
import { AttachmentBuilder } from "discord.js";
import client from "./client.mjs";
const discordCdnUrl = "https://cdn.discordapp.com/attachments/";
const replitUrl = "https://archiver-viewer.luisferreira.repl.co/viewer";
async function exportTask(jobId, data, tasker) {
    switch (data.format) {
        case "json":
            await exportJSON(jobId, data, tasker);
            break;
        case "webpage":
            await exportWebpage(jobId, data, tasker);
            break;
        case "text":
            await exportText(jobId, data, tasker);
            break;
    }
}
async function exportJSON(jobId, data, tasker) {
    const { srcChannelId, srcChannelName, destChannelId } = data;
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
        await destChannel.send({ files: [attachment] });
    }
    else {
        throw Error(`Channel ${destChannel.name} is not a text channel`);
    }
    await srcChannel.send(`Channel exported. You may now delete it if you wish`);
}
async function exportWebpage(jobId, data, tasker) {
    const { srcChannelId, srcChannelName, destChannelId } = data;
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
        const fileUrl = [...msg.attachments.values()][0].url.replace(discordCdnUrl, "");
        await destChannel.send(`${replitUrl}/${fileUrl}`);
    }
    else {
        throw Error(`Channel ${destChannel.name} is not a text channel`);
    }
    await srcChannel.send(`Channel exported. You may now delete it if you wish`);
}
async function exportText(jobId, data, tasker) {
    const { srcChannelId, srcChannelName, destChannelId } = data;
    const messages = await retrieveAllMessages(srcChannelId);
    const textBuilder = [];
    // Append title
    textBuilder.push(capitalize(srcChannelName.replaceAll("-", " ")), "", "");
    // Append text
    for (let { username, content } of messages) {
        textBuilder.push(username, content, "");
    }
    // Send file
    const attachment = new AttachmentBuilder(Buffer.from(textBuilder.join("\n"), "utf-8"));
    attachment.setName(`${srcChannelName.replaceAll("-", " ")}.txt`);
    const destChannel = await client.channels.fetch(destChannelId);
    const srcChannel = await client.channels.fetch(srcChannelId);
    if (destChannel.isTextBased()) {
        await destChannel.send({ files: [attachment] });
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
