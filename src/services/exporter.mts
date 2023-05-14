import Tasker from "./tasker.mjs"
import type { IJobQueue, ITasker, TaskFunction } from "../libs/interfaces/tasker.mjs"
import { retrieveAllMessages } from "./archival.mjs"
import { capitalize } from "../utils.mjs"
import { AttachmentBuilder, TextChannel } from "discord.js"
import client from "./client.mjs"

type RpMessage = {
    avatarUrl: string
    username: string
    content: string
}

type ExportJob = {
    format: "json" | "webpage"
    srcChannelId: string
    srcChannelName: string

    destChannelId: string
}

const discordCdnUrl = "https://cdn.discordapp.com/attachments/";
const replitUrl = "https://archiver-viewer.luisferreira.repl.co/viewer";

async function exportTask(jobId: string, data: ExportJob, tasker: ITasker) {
    const {format, srcChannelId, srcChannelName, destChannelId} = data
    const messages: RpMessage[] = await retrieveAllMessages(srcChannelId)

    const json = {
        "name": capitalize(srcChannelName.replaceAll("-", " ")),
        "messages": messages
    }
    const jsonBuffer = Buffer.from(JSON.stringify(json))
    const attachment = new AttachmentBuilder(jsonBuffer)
    attachment.setName(`${srcChannelName.replaceAll("-", " ")}.json`)

    const destChannel = await client.channels.fetch(destChannelId)
    const srcChannel = await client.channels.fetch(srcChannelId) as TextChannel

    if (destChannel.isTextBased()) {
        const msg = await destChannel.send({files: [attachment]})

        if (format === "webpage") {
            const fileUrl = [...msg.attachments.values()][0].url.replace(discordCdnUrl, "")
            await destChannel.send(`${replitUrl}/${fileUrl}`)
        }
    } else {
        throw Error(`Channel ${destChannel.name} is not a text channel`);
    }

    await srcChannel.send(`Channel exported. You may now delete it if you wish`)
}

Tasker.addTaskHandlers(exportTask)

async function queue(id: string, data: ExportJob) {
    await Tasker.addJob(id, `Export ${data.srcChannelName}`, [[exportTask, data]])
}

async function dequeue(id: string) {
    await Tasker.removeJob(id)
}

async function getTaskCountFor(jobId: string, task: TaskFunction) {
    return (await Tasker.getTasksFor(jobId, task)).length
}

const Exporter: IJobQueue<ExportJob> = {
    queue,
    dequeue,
    getTaskCountFor
}

export default Exporter