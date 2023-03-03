import { MessageAttachment } from "discord.js";
import { createMultiTagFunction, IJob } from "../../libs/worker/index.mjs"; 
import { capitalize } from "../../utils.mjs";
import { SendJob } from "./types.mjs";
import client from "../../client.mjs";

/**
 * JSON FORMAT
 * {
 *     "name": "rp name"
 *     "messages": [{
 *         "avatarUrl": "someurl",
 *         "content": "the rp message",
 *         "username": "name of the user"
 *     }]
 * }
 */

async function sendJsonFile(job: IJob<SendJob>): Promise<IJob<SendJob>> {
    const { srcChannelName, fileName, messages, destChannelId } = job.data;
    const json = {
        "name": capitalize(srcChannelName.replaceAll("-", " ")),
        "messages": messages
    };
    const jsonBuffer = Buffer.from(JSON.stringify(json));
    const attachment = new MessageAttachment(jsonBuffer, fileName)
    const channel = await client.channels.fetch(destChannelId)

    if (channel.isText()) {
        await channel.send({files: [attachment]})
    } else {
        throw Error(`Channel ${channel.name} is not a text channel`);
    }

    return job;
}


const discordCdnUrl = "https://cdn.discordapp.com/attachments/";
const replitUrl = "https://archiver-viewer.luisferreira.repl.co/viewer";

async function sendWebPage(job: IJob<SendJob>): Promise<IJob<SendJob>> {
    const { srcChannelName, fileName, messages, destChannelId } = job.data;
    const json = {
        "name": capitalize(srcChannelName.replaceAll("-", " ")),
        "messages": messages
    };
    const jsonBuffer = Buffer.from(JSON.stringify(json));
    const attachment = new MessageAttachment(jsonBuffer, fileName)
    const channel = await client.channels.fetch(destChannelId)

    if (channel.isText()) {
        const msg = await channel.send({files: [attachment]})
        const fileUrl = [...msg.attachments.values()][0].url.replace(discordCdnUrl, "");
        await channel.send(`${replitUrl}/${fileUrl}`);
    } else {
        throw Error(`Channel ${channel.name} is not a text channel`);
    }

    return job;
}

const send = createMultiTagFunction<SendJob, SendJob>(
    {tag: "json", fn: sendJsonFile},
    {tag: "webpage", fn: sendWebPage}
);
export default send;