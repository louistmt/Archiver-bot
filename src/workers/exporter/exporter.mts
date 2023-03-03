// TODO: Create a worker to handle exporting rps into a file

// Retrieve the messages in the src channel
// Format it into the specified format (json or webpage)
// Export the format to its destination (dm or guild channel)
// Erase the source channel

import { retrieveAllMessages } from "../../api/archival.mjs";
import { Worker, Task } from "../../libs/worker/index.mjs";
import { ExportJob, SendJob } from "./types.mjs";
import send from "./send.mjs";
import { fileExists } from "../../utils.mjs";
import Config from "../../config.mjs";
import { deleteChannel } from "../../api/channels.mjs";

const retrieveTask = Task.create<ExportJob, SendJob>("Retrieve Messages");
retrieveTask.work(async (job) => {
    const { data } = job;
    const { srcChannelId, srcChannelName } = data;
    const messages = await retrieveAllMessages(srcChannelId);

    return job.from<SendJob>({
        ...job.data,
        fileName: `${srcChannelName.replaceAll("-", " ")}.json`,
        messages
    });
})

const sendTask = Task.create<SendJob, SendJob>("Send File");
sendTask.work(send);

const eraseTask = Task.create<SendJob, SendJob>("Erase Channel");
eraseTask.work(async (job) => {
    await deleteChannel(job.data.srcChannelId);
    return job;
})

const Exporter = Worker.create<ExportJob>("Exporter");
Exporter.tasks()
    .add(retrieveTask)
    .add(sendTask)
    .add(eraseTask)

if (fileExists(Config.paths.exporterState)) {
    Exporter.load(Config.paths.exporterState)
    Exporter.resume()
}

export default Exporter;