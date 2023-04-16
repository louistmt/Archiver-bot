import type { IJobQueue, ITasker, TaskFunction } from "../libs/tasker-interfaces.mjs";
import Tasker from "./tasker.mjs";
import { createArchiveChannel, retrieveAllMessages } from "../api/archival.mjs";
import { postMessageToWebhook } from "../api/webhooks.mjs";
import { postMessage } from "../api/channels.mjs";

type ArchiveJob = {
    srcChannelId: string
    srcChannelName: string
    destServerId: string
    destCategoryName: string
}

type CreateDest = {
    srcChannelId: string
    destServerId: string
    destCategoryName: string
    destChannelName: string
}

type GetMsgs = {
    webhookId: string
    webhookToken: string
    srcChannelId: string
}

type SendMsg = {
    webhookId: string
    webhookToken: string
    avatarUrl: string
    username: string
    content: string
}

type NotifyDone = {
    srcChannelId: string,
}

async function createDestTask(jobId: string, data: CreateDest, tasker: ITasker) {
    const { destServerId, destChannelName, destCategoryName, srcChannelId } = data
    const { webhookId, webhookToken } = await createArchiveChannel(destServerId, destCategoryName, destChannelName)
    await tasker.addTasks<GetMsgs>(jobId, getMsgsTask, { srcChannelId, webhookId, webhookToken })
}

async function getMsgsTask(jobId: string, data: GetMsgs, tasker: ITasker) {
    const { srcChannelId, webhookId, webhookToken } = data
    const msgs = await retrieveAllMessages(srcChannelId)
    const nextData: SendMsg[] = msgs.map(({ username, avatarUrl, content }) => {
        return { webhookId, webhookToken, username, avatarUrl, content }
    })
    await tasker.addTasks<SendMsg>(jobId, sendMsgTask, ...nextData)
    await tasker.addTasks<NotifyDone>(jobId, notifyDoneTask, { srcChannelId })
}

export async function sendMsgTask(jobId: string, data: SendMsg, tasker: ITasker) {
    const { webhookId, webhookToken, avatarUrl, content, username } = data
    await postMessageToWebhook(webhookId, webhookToken, avatarUrl, username, content)
}

export async function notifyDoneTask(jobId: string, data: NotifyDone, tasker: ITasker) {
    const { srcChannelId } = data
    await postMessage(srcChannelId, `Done archiving this channel. You can delete it now`)
}

Tasker.addTaskHandlers(
    createDestTask,
    getMsgsTask,
    sendMsgTask,
    notifyDoneTask
)

export async function queue(jobId: string, data: ArchiveJob) {
    await Tasker.addJob(jobId, `Archive ${data.srcChannelName}`, [[createDestTask, data]])
}

export async function dequeue(jobId: string) {
    await Tasker.removeJob(jobId)
}

export async function getCountFor(jobId: string, task: TaskFunction): Promise<number> {
    return (await Tasker.getTasksFor(jobId, task)).length
}

const Archiver: IJobQueue<ArchiveJob> = {
    queue,
    dequeue,
    getCountFor
};

export default Archiver