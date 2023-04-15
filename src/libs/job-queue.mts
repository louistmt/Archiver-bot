import { JSONType } from "./common.mjs";

/**
 * Generic interface to define a job queue. This is
 * supposed to be used as a standard to define any
 * type of workers required by the bot.
 */
export interface IJobQueue<T extends JSONType = any> {
    queue(id: string, data: T): Promise<void>
    dequeue(id: string): Promise<void>
    getCountFor(id: string, task: TaskFunction): Promise<number>
}

export type TaskFunction<T extends JSONType = any> = (jobId: string, data: T, tasker: ITasker) => Promise<void>

export interface ITasker {
    addTaskHandlers(...handlers: TaskFunction[])
    start(): Promise<void>
    addTasks<T extends JSONType = any>(jobId: string, task: TaskFunction<T>, ...data: T[]): Promise<void>
    removeTasks(jobId: string): Promise<void>
    getTasksFor(jobId: string, task: TaskFunction): Promise<any[]>
}

