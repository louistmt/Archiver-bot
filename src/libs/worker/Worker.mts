import TaskSequence from "./TaskSequence.mjs";
import { IJob, ITask, ITaskSequence, IWorker, JobState } from "./types.mjs";
import { preLogs } from "../../utils.mjs";
import { writeFileSync, readFileSync } from "node:fs";
import Job from "./Job.mjs";
import { JSONObject } from "../common.mjs";

enum WorkerState {
    READY, WORKING, SHUTDOWN
}

export default class Worker<T extends JSONObject> implements IWorker<T> {
    private log;
    private logError;

    private jobsList: IJob<JSONObject>[] = [];
    private taskList: ITask<JSONObject, JSONObject>[] = [];

    private state: WorkerState = WorkerState.READY;
    private workPromise: Promise<void> = undefined;
    private taskListIdx: number = 0;

    name: string;

    private constructor(name: string) {
        this.name = name;
        const logs = preLogs(`Worker-${name}`);
        this.log = logs.log;
        this.logError = logs.error;
    }

    static create<T extends JSONObject>(name: string): IWorker<T> {
        return new Worker(name);
    }

    get jobs() {
        return [...this.jobsList];
    }

    tasks(): ITaskSequence<T> {
        return TaskSequence.create<T>(this.taskList);
    }

    enqueueJob(job: IJob<T>) {
        if (this.state === WorkerState.SHUTDOWN) return;
        if (this.taskList.length === 0) throw "No tasks added to work on this job. Make sure you setup your worker before queueing jobs";
        if (this.jobsList.includes(job)) throw "Adding the same Job reference twice is not allowed.";

        this.jobsList.push(job);

        if (this.state === WorkerState.WORKING) return;

        this.state = WorkerState.WORKING;
        this.workPromise = this.doJobs();
    }

    async doJobs() {
        while (this.jobsList.length > 0 && this.state !== WorkerState.SHUTDOWN) {
            let job = this.jobsList[0];
            let task = this.taskList[this.taskListIdx];

            while (this.taskListIdx < this.taskList.length && this.state as WorkerState !== WorkerState.SHUTDOWN) {
                this.log(`Doing task ${task.name} for job ${job.name}`);
                const jobUpdate = await task.doJob(job);
                this.log(`Finished task ${task.name} for job ${job.name}`);
                const taskUpdate = this.nextTask(jobUpdate);

                job = this.handleJobResult(jobUpdate);
                if (!this.canContinue(job)) break;
                task = taskUpdate;
                this.jobsList[0] = job;
            }

            if (this.taskListIdx >= this.taskList.length || job.isStateImmutable()) {
                this.taskListIdx = 0;
                this.jobsList.shift();
            }
        }

        this.state = this.state === WorkerState.WORKING ? WorkerState.READY : WorkerState.SHUTDOWN;
    }

    private handleJobResult(job: IJob<JSONObject>): IJob<JSONObject> {
        if (job.state === JobState.FATAL_ERROR) {
            this.logError(
                `A fatal error occurred for job ${job.name}\n`,
                job.fatalErr,
                "\nWhile handling\n",
                job.err
            );
            return job;
        }

        if (job.state === JobState.ERROR) {
            this.logError(
                `An error occured for job ${job.name} and wasn't handled\n`,
                job.err
            );
            job = job.cancel()
            return job;
        }

        if (job.state === JobState.CANCELED) {
            this.log(`Job ${job.name} was canceled`);
            return job;
        }
        if (job.state === JobState.REPEAT_TASK || job.state === JobState.SKIP_TASK || job.state === JobState.WORKER_SHUTDOWN) job = job.okay();

        return job;
    }

    private nextTask(job: IJob<JSONObject>): ITask<JSONObject, JSONObject> {
        if (job.state === JobState.OKAY || job.state === JobState.SKIP_TASK) this.taskListIdx++;
        if (job.state === JobState.CANCELED || job.state === JobState.ERROR || job.state === JobState.FATAL_ERROR) this.taskListIdx = 0;
        return this.taskList[this.taskListIdx];
    }

    private canContinue(job: IJob<JSONObject>): boolean {
        return job.state !== JobState.CANCELED && job.state !== JobState.ERROR && job.state !== JobState.FATAL_ERROR;
    }

    cancelJob(name: string) {
        for (let job of this.jobsList) {
            if (job.name === name) job.cancel();
        }
    }

    async shutdown(): Promise<void> {
        this.state = WorkerState.SHUTDOWN;
        this.jobsList.forEach(job => { job.pause() })
        await this.workPromise;
    }

    save(filePath: string) {
        let serializedJobs = this.jobsList.map(job => job.serialize());

        writeFileSync(filePath, JSON.stringify({
            name: this.name,
            pausedTaskName: this.taskList[this.taskListIdx].name,
            jobsList: serializedJobs
        }));
    }

    load(filePath: string) {
        const state = JSON.parse(readFileSync(filePath, { encoding: "utf-8" }));
        const jobList: IJob<T>[] = [];
        const taskIdx = this.taskList.findIndex((task) => task.name === state.pausedTaskName);

        if (taskIdx === -1)
            throw `Unabled to find paused task ${state.pausedTaskName}. This might be due to not adding the tasks before loading the state file`;

        for (let { name, data, canceled } of state.jobsList) {
            jobList.push(Job.create<T>(name, data, canceled));
        }

        this.name = state.name;
        this.jobsList = jobList;
        this.taskListIdx = taskIdx;
    }

    resume() {
        this.state = WorkerState.WORKING;
        this.workPromise = this.doJobs();
    }

}