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
    const { srcChannelName, fileName, messages, destinationChannelId } = job.data;
    const json = {
        "name": capitalize(srcChannelName.replaceAll("-", " ")),
        "messages": messages
    };
    const jsonBuffer = Buffer.from(JSON.stringify(json));
    const attachment = new MessageAttachment(jsonBuffer, fileName)
    const channel = await client.channels.fetch(destinationChannelId)

    if (channel.isText()) {
        await channel.send({files: [attachment]})
    }

    return job;
}

const send = createMultiTagFunction<SendJob, SendJob>({tag: "json", fn: sendJsonFile});
export default send;