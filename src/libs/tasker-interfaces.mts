import { JSONType } from "./common.mjs";

/**
 * Generic interface to define a job queue. This is
 * supposed to be used as a standard to define any
 * type of workers required by the bot.
 */
export interface IJobQueue<T extends JSONType = any> {
    queue(id: string, data: T): Promise<void>
    dequeue(id: string): Promise<void>
    getTaskCountFor(id: string, task: TaskFunction): Promise<number>
}

export type TaskFunction<T extends JSONType = any> = (jobId: string, data: T, tasker: ITasker) => Promise<void>

export interface ITasker {
    start(): Promise<void>
    stop(): Promise<void>
    addTaskHandlers(...handlers: TaskFunction[])
    addJob(jobId: string, jobName: string, tasks: [TaskFunction, any][]): Promise<void>
    addTasks<T extends JSONType = any>(jobId: string, task: TaskFunction<T>, ...data: T[]): Promise<void>
    removeJob(jobId: string): Promise<void>
    getTasksFor(jobId: string, task: TaskFunction): Promise<any[]>
}

export class Controller {

    _interrupted = false
    _interruptConfirm = undefined

    _signalled = false
    _signaller = undefined

    async waitSignal() {
        if (this._signalled || this._interrupted) {
            this._signalled = false
            return
        }

        if (this._signaller) throw Error("Already waiting for a signal")

        const promise = new Promise((resolve) => {this._signaller = resolve})
        await promise
        this._signalled = false
    }

    signal() {
        if (this._signaller) this._signaller()
        this._signalled = true
        this._signaller = undefined
    }

    get interrupted() {
        return this._interrupted
    }

    async interrupt() {
        if (this._signaller) this._signaller()
        this._interrupted = true
        this._signalled = true
        this._signaller = undefined

        const promise = new Promise((resolve) => {this._interruptConfirm = resolve})
        await promise
    }

    confirmInterrupt() {
        this._interruptConfirm()
        this._interruptConfirm = undefined
    }
}