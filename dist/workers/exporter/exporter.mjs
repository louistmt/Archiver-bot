// TODO: Create a worker to handle exporting rps into a file
// Retrieve the messages in the channel
// Format it into the specified format (json, etc)
// Export the format to its destination (dm or guild channel)
import { retrieveAllMessages } from "../../api/archival.mjs";
import { Worker, Task } from "../../libs/worker/index.mjs";
import send from "./send.mjs";
import { fileExists } from "../../utils.mjs";
import Config from "../../config.mjs";
const retrieveTask = Task.create("Retrieve Messages");
retrieveTask.work(async (job) => {
    const { data } = job;
    const { srcChannelId, srcChannelName } = data;
    const messages = await retrieveAllMessages(srcChannelId);
    return job.from({
        ...job.data,
        fileName: `${srcChannelName.replaceAll("-", " ")}.json`,
        messages
    });
});
const sendTask = Task.create("Send Task");
sendTask.work(send);
const Exporter = Worker.create("Exporter");
Exporter.tasks()
    .add(retrieveTask)
    .add(sendTask);
if (fileExists(Config.paths.exporterState)) {
    Exporter.load(Config.paths.exporterState);
    Exporter.resume();
}
export default Exporter;
