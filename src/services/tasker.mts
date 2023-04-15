import { JobTasks } from "./database.mjs";
import { ITasker, TaskFunction } from "../libs/job-queue.mjs";
import { JSONType } from "../libs/common.mjs";
import { createSleepAwake } from "../utils.mjs";

const handlerMap: Map<string, TaskFunction> = new Map()
const {awake, sleep} = createSleepAwake()

function addTaskHandlers(...handlers: TaskFunction[]) {
    for (let handler of handlers) {
        const handlerName = handler.name
        if (handlerMap.has(handlerName)) throw new Error(`Task handler named ${handlerName} added twice. Make sure handler.name is unique`)
        handlerMap.set(handlerName, handler)
    }
}

async function start() {
    while (true) {
        const task = await JobTasks.findOne({order: ["rowid", "ASC"]})

        if (task === null) {
            await sleep()
            continue
        }

        const {jobId, taskName, data: serialized} = task
        if (!handlerMap.has(taskName)) throw new Error(`Task named ${taskName} has no corresponding handler`)
        const handler = handlerMap.get(taskName)
        const data = JSON.parse(serialized)
        await handler(jobId, data, Tasker)
        await task.destroy()
    }
}

async function addTasks<T extends JSONType = any>(jobId: string, task: TaskFunction<T>, ...data: T[]) {
    const taskName = task.name
    if (!handlerMap.has(taskName)) throw new Error(`Task named ${taskName} does not exist. Make sure it was added`)

    const tasks: {jobId: string, taskName: string, data: string}[] = []

    for (let item of data) {
        const serialized = JSON.stringify(item)
        tasks.push({jobId, taskName, data: serialized})
    }

    await JobTasks.bulkCreate(tasks, {validate: true})
    awake()
}

async function removeTasks(jobId: string) {
    await JobTasks.destroy({where: {jobId}})
}

async function getTasksFor(jobId: string, task: TaskFunction<any>) {
    return JobTasks.findAll({where: {jobId, taskName: task.name}})
}

const Tasker: ITasker = {
    addTaskHandlers,
    start,
    addTasks,
    removeTasks,
    getTasksFor
};

export default Tasker;