import { IJob, ITaskErrorHandler } from "./types.mjs";
import { JSONObject } from "../common.mjs";

export default class TaskErrorHandler<K, T extends JSONObject, R extends JSONObject> implements ITaskErrorHandler<K, T, R> {
    private errorMap: Map<K, (job: IJob<T>) => Promise<IJob<T | R>>> = new Map();
    private defaultHandler: (job: IJob<T>) => Promise<IJob<T | R>> = async (job) => job;

    private constructor() {}

    static create<K, T extends JSONObject, R extends JSONObject>(): ITaskErrorHandler<K, T, R> {
        return new TaskErrorHandler();
    }

    key(fn: (err: any) => K) {
        this.keyFn = fn;
    }

    match(key: K, handler: (job: IJob<T>) => Promise<IJob<T | R>>) {
        if (this.errorMap.has(key)) throw Error(`Handler for key '${key}' already exists`);
        this.errorMap.set(key, handler);
        return this;
    }

    default(handler: (job: IJob<T>) => Promise<IJob<T | R>>) {
        this.defaultHandler = handler;
    }

    keyFn: (err: any) => K = (err) => undefined;
    async handle(job: IJob<T>): Promise<IJob<JSONObject>> {
        try {
            const key = this.keyFn(job.err);
            const handler = this.errorMap.get(key) ?? this.defaultHandler;
            return await handler(job);
        } catch (anotherErr) {
            return job.fatal(anotherErr);
        }
    }

}