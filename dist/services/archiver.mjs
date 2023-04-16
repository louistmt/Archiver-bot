import Tasker from "./tasker.mjs";
import { createArchiveChannel, retrieveAllMessages } from "../api/archival.mjs";
import { postMessageToWebhook } from "../api/webhooks.mjs";
import { postMessage } from "../api/channels.mjs";
async function createDestTask(jobId, data, tasker) {
    const { destServerId, destChannelName, destCategoryName, srcChannelId } = data;
    const { webhookId, webhookToken } = await createArchiveChannel(destServerId, destCategoryName, destChannelName);
    await tasker.addTasks(jobId, getMsgsTask, { srcChannelId, webhookId, webhookToken });
}
async function getMsgsTask(jobId, data, tasker) {
    const { srcChannelId, webhookId, webhookToken } = data;
    const msgs = await retrieveAllMessages(srcChannelId);
    const nextData = msgs.map(({ username, avatarUrl, content }) => {
        return { webhookId, webhookToken, username, avatarUrl, content };
    });
    await tasker.addTasks(jobId, sendMsgTask, ...nextData);
    await tasker.addTasks(jobId, notifyDoneTask, { srcChannelId });
}
export async function sendMsgTask(jobId, data, tasker) {
    const { webhookId, webhookToken, avatarUrl, content, username } = data;
    await postMessageToWebhook(webhookId, webhookToken, avatarUrl, username, content);
}
export async function notifyDoneTask(jobId, data, tasker) {
    const { srcChannelId } = data;
    await postMessage(srcChannelId, `Done archiving this channel. You can delete it now`);
}
Tasker.addTaskHandlers(createDestTask, getMsgsTask, sendMsgTask, notifyDoneTask);
export async function queue(jobId, data) {
    await Tasker.addJob(jobId, `Archive ${data.srcChannelName}`, [[createDestTask, data]]);
}
export async function dequeue(jobId) {
    await Tasker.removeJob(jobId);
}
export async function getCountFor(jobId, task) {
    return (await Tasker.getTasksFor(jobId, task)).length;
}
const Archiver = {
    queue,
    dequeue,
    getCountFor
};
export default Archiver;
