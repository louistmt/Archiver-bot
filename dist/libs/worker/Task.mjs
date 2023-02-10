import TaskErrorHandler from "./TaskErrorHandler.mjs";
import { JobState } from "./types.mjs";
export default class Task {
    name;
    workFn = async (job) => job;
    errorHandler = TaskErrorHandler.create();
    constructor(name) {
        this.name = name;
    }
    static create(name) {
        return new Task(name);
    }
    work(workFn) {
        this.workFn = workFn;
    }
    errors() {
        return this.errorHandler;
    }
    async doJob(job) {
        let jobUpdate;
        try {
            jobUpdate = await this.workFn(job);
        }
        catch (err) {
            jobUpdate = job.error(err);
        }
        if (jobUpdate.state === JobState.ERROR)
            jobUpdate = await this.errorHandler.handle(jobUpdate);
        return jobUpdate;
    }
}
