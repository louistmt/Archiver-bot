import { JobTasks, Jobs, sequelize } from "./database.mjs";
import { Controller } from "../libs/tasker-interfaces.mjs";
import { preLogs } from "../utils.mjs";
const { log, error } = preLogs("Tasker");
const handlerMap = new Map();
const controller = new Controller();
function addTaskHandlers(...handlers) {
    for (let handler of handlers) {
        const handlerName = handler.name;
        if (handlerMap.has(handlerName))
            throw new Error(`Task handler named ${handlerName} added twice. Make sure handler.name is unique`);
        handlerMap.set(handlerName, handler);
    }
}
async function start() {
    log("Started service");
    while (!controller.interrupted) {
        const task = await JobTasks.findOne({ order: [["rowid", "ASC"]] });
        if (task === null) {
            log("Waiting for tasks");
            await controller.waitSignal();
            log("New tasks arrived");
            continue;
        }
        const { jobId, taskName, data: serialized } = task;
        if (!handlerMap.has(taskName))
            throw new Error(`Task named ${taskName} has no corresponding handler`);
        const handler = handlerMap.get(taskName);
        const data = JSON.parse(serialized);
        try {
            await handler(jobId, data, Tasker);
        }
        catch (err) {
            const { jobName } = await Jobs.findOne({ "where": { jobId } });
            error(`Canceling all request for ${jobName} due to an unhandled error\n`, err);
            await Tasker.removeJob(jobId);
        }
        await task.destroy();
        if (!(await JobTasks.findOne({ where: { jobId } })))
            await Jobs.destroy({ where: { jobId } });
    }
    controller.confirmInterrupt();
}
async function stop() {
    log("Shutting down...");
    await controller.interrupt();
    log("Shutdown complete");
}
async function addJob(jobId, jobName, tasks) {
    await sequelize.transaction(async (t) => {
        const tsks = tasks.map(([handler, item]) => {
            return { jobId, taskName: handler.name, data: JSON.stringify(item) };
        });
        await Jobs.create({ jobId, jobName }, { transaction: t });
        await JobTasks.bulkCreate(tsks, { validate: true, transaction: t });
    });
    controller.signal();
}
async function addTasks(jobId, task, ...data) {
    const taskName = task.name;
    if (!handlerMap.has(taskName))
        throw new Error(`Task named ${taskName} does not exist. Make sure it was added`);
    const tasks = [];
    for (let item of data) {
        const serialized = JSON.stringify(item);
        tasks.push({ jobId, taskName, data: serialized });
    }
    await JobTasks.bulkCreate(tasks, { validate: true });
    controller.signal();
}
async function removeJob(jobId) {
    await sequelize.transaction(async (t) => {
        await JobTasks.destroy({ where: { jobId }, transaction: t });
        await Jobs.destroy({ where: { jobId }, transaction: t });
    });
}
async function getTasksFor(jobId, task) {
    return await JobTasks.findAll({ where: { jobId, taskName: task.name }, order: [["rowid", "ASC"]] });
}
const Tasker = {
    addTaskHandlers,
    start,
    stop,
    addJob,
    addTasks,
    removeJob,
    getTasksFor
};
export default Tasker;
