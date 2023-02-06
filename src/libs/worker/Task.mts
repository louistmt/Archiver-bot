import TaskErrorHandler from "./TaskErrorHandler.mjs";
import { IJob, ITask, ITaskErrorHandler, JobState } from "./types.mjs";
import { JSONObject } from "../common.mjs";

export default class Task<T extends JSONObject, R extends JSONObject> implements ITask<T, R> {
    name: string;
    private workFn: (job: IJob<JSONObject>) => Promise<IJob<JSONObject>> = async (job) => job;
    private errorHandler: ITaskErrorHandler<any, JSONObject, JSONObject> = TaskErrorHandler.create<any, JSONObject, JSONObject>();

    private constructor(name: string) {
        this.name = name;
    }

    static create<T extends JSONObject, R extends JSONObject>(name: string): ITask<T, R> {
        return new Task(name);
    }

    work(workFn: (job: IJob<T>) => Promise<IJob<R>>) {
        this.workFn = workFn;
    }

    errors<K>(): ITaskErrorHandler<K, T, R> {
        return this.errorHandler as ITaskErrorHandler<K, T, R>;
    }
    
    async doJob(job: IJob<JSONObject>): Promise<IJob<JSONObject>> {
        let jobUpdate: IJob<JSONObject>;

        try {
            jobUpdate = await this.workFn(job);
        } catch (err) {
            jobUpdate = job.error(err);
        }

        if (jobUpdate.state === JobState.ERROR) jobUpdate = await this.errorHandler.handle(jobUpdate);
        return jobUpdate;
    }
    
}