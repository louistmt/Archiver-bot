import Config from "../config.mjs";
import { preLogs, delay, fileExists } from "../utils.mjs";
import ServersConfigChest from "../data/server-config.mjs";
import { createArchiveChannel, retrieveAllMessages } from "../api/archival.mjs";
import { postMessageToWebhook, deleteWebhook } from "../api/webhooks.mjs";
import { postMessage, deleteChannel } from "../api/channels.mjs";
import { JobState, Task, Worker } from "../libs/worker/index.mjs";
import { HTTPError } from "discord.js";

const { error: logError } = preLogs("Archiver");
const serversConfig = ServersConfigChest.get();

type RpMessage = {
    avatarUrl: string
    username: string
    content: string
}

export type RpArchiveJob = {
    serverId: string
    srcServerId: string
    srcChannelId: string
    srcChannelName: string
    destCategoryName: string
}

type GetRpMsgsJob = {
    serverId: string
    srcServerId: string
    srcChannelName: string
    srcChannelId: string
    destChannelId: string
    destCategoryName: string
    webhookId: string
    webhookToken: string
}

export type SendRpMsgsJob = {
    serverId: string
    srcServerId: string
    srcChannelName: string
    srcChannelId: string
    destCategoryName: string
    webhookId: string
    webhookToken: string
    msgs: RpMessage[]
    msgCount: number
}

type CleanupJob = {
    serverId: string
    srcServerId: string
    srcChannelName: string
    srcChannelId: string
    webhookId: string
}


const createDestTask = Task.create<RpArchiveJob, GetRpMsgsJob>("Create Destination Channel")
createDestTask.work(async (job) => {
    const { data } = job;
    const { serverId, srcServerId, srcChannelId, srcChannelName, destCategoryName } = data;
    const { channelId, webhookId, webhookToken } = await createArchiveChannel(serverId, destCategoryName, srcChannelName);

    return job.from<GetRpMsgsJob>({
        serverId,
        srcServerId,
        srcChannelName,
        srcChannelId,
        destCategoryName,
        destChannelId: channelId as string,
        webhookId: webhookId as string,
        webhookToken: webhookToken as string
    });
})
createDestTask.errors()
    .default(async (job) => {
        if (job.err instanceof HTTPError) {
            await delay(10 * 1000);
            return job.repeatTask(job.data)
        }

        return job;
    })


const getRpMsgsTask = Task.create<GetRpMsgsJob, SendRpMsgsJob>("Get Rp Messages")
getRpMsgsTask.work(async (job) => {
    const { data } = job;
    const { srcChannelId } = data;
    const msgs = await retrieveAllMessages(srcChannelId);

    return job.from<SendRpMsgsJob>({
        ...data,
        msgs,
        msgCount: msgs.length
    });
})
getRpMsgsTask.errors()
    .default(async (job) => {
        if (job.err instanceof HTTPError) {
            await delay(10 * 1000);
            return job.repeatTask(job.data)
        }

        return job;
    })


const sendRpMsgsTask = Task.create<SendRpMsgsJob, CleanupJob>("Send rp Messages")
sendRpMsgsTask.work(async (job) => {
    const { data } = job;
    const { serverId, srcServerId, webhookId, webhookToken, srcChannelId, msgs, srcChannelName } = data;

    while (msgs.length > 0 && job.state !== JobState.CANCELED && job.state !== JobState.WORKER_SHUTDOWN) {
        const { avatarUrl, content, username } = msgs[0];
        await delay(3 * 1000);
        await postMessageToWebhook(webhookId, webhookToken, avatarUrl, username, content);

        msgs.shift();
    }

    if (msgs.length === 0) return job.from<CleanupJob>({ serverId, srcServerId, srcChannelId, webhookId, srcChannelName });
    return job;
})
sendRpMsgsTask.errors()
    .default(async (job) => {
        if (job.err instanceof HTTPError) {
            await delay(10 * 1000);
            return job.repeatTask(job.data)
        }

        return job;
    })


const cleanupTask = Task.create<CleanupJob, CleanupJob>("Cleanup")
cleanupTask.work(async (job) => {
    const { data } = job;
    const { srcServerId, webhookId, srcChannelId, srcChannelName } = data;

    try {
        await deleteWebhook(webhookId)
    } catch (err) {
        logError(err)
    }

    await deleteChannel(srcChannelId)
    await postMessage(serversConfig.getOrCreate(srcServerId).logChannelId, `Finished archiving ${srcChannelName}`)
    return job
})
cleanupTask.errors()
    .default(async (job) => {
        if (job.err instanceof HTTPError) {
            await delay(10 * 1000);
            return job.repeatTask(job.data)
        }

        return job;
    })


const Archiver = Worker.create<RpArchiveJob>("Archiver")
Archiver.tasks()
    .add(createDestTask)
    .add(getRpMsgsTask)
    .add(sendRpMsgsTask)
    .add(cleanupTask);

if (fileExists(Config.paths.archiverState)) {
    Archiver.load(Config.paths.archiverState)
    Archiver.resume()
}

export default Archiver;