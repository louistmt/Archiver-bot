import { JSONObject } from "../common.mjs";

/**
 * Indicates the state of the job.
 */
export enum JobState {
    /**
     * The job can progress
     */
    OKAY,
    /**
     * The worker was shutdown and the current task
     * should exit
     */
    WORKER_SHUTDOWN,
    /**
     * The job was canceled and should be discarded.
     */
    CANCELED,
    /**
     * There was an error while handling the job but
     * can be recovered.
     */
    ERROR,
    /**
     * There was a fatal error while handling the job.
     * Recovery is no longer possible.
     */
    FATAL_ERROR, 
    /**
     * Give the job to the next task.
     */
    SKIP_TASK, 
    /**
     * Give the job to the same task that handled it before.
     */
    REPEAT_TASK
}

export interface IJob<T extends JSONObject> {
    readonly tag: string
    readonly name: string
    readonly data: T
    readonly err: any
    readonly fatalErr: any
    readonly state: JobState
    isStateImmutable(): boolean
    okay(): IJob<T>
    pause(): IJob<T>
    cancel(): IJob<T>
    error(err: any): IJob<T>
    fatal(err: any): IJob<T>
    repeatTask(data: T): IJob<T>
    skipTask<R extends JSONObject>(data: R): IJob<R>
    from<R extends JSONObject>(data: R): IJob<R>
    serialize(): JSONObject
}

export interface ITaskErrorHandler<K, T extends JSONObject, R extends JSONObject> {
    key(fn: (err: any) => K)
    match(key: K, handler: (job: IJob<T>) => Promise<IJob<T | R>>): ITaskErrorHandler<K, T, R>
    default(handler: (job: IJob<T>) => Promise<IJob<T | R>>)

    readonly keyFn: (err: any) => K
    handle(job: IJob<T>): Promise<IJob<JSONObject>>
}

export type WorkFunction<T extends JSONObject, R extends JSONObject> = (job: IJob<T>) => Promise<IJob<R>>

export interface ITask<T extends JSONObject, R extends JSONObject> {
    name: string;
    
    work(workFn: WorkFunction<T, R>)
    errors<K>(): ITaskErrorHandler<K, T, R>

    doJob(job: IJob<JSONObject>): Promise<IJob<JSONObject>>
}

export interface ITaskSequence<T extends JSONObject> {
    readonly tasksMap: Map<string, ITask<JSONObject, JSONObject>>

    add<R extends JSONObject>(task: ITask<T, R>): ITaskSequence<R>
}

export interface IWorker<T extends JSONObject> {
    readonly name: string
    readonly jobs: IJob<JSONObject>[]

    tasks(): ITaskSequence<T>

    enqueueJob(job: IJob<T>): Promise<void>
    cancelJob(name: string)

    shutdown(): Promise<void>
    save(filePath: string)
    load(filePath: string)
    resume()
}