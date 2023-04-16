import TaskSequence from "./TaskSequence.mjs";
import { JobState } from "./types.mjs";
import { preLogs } from "../../utils.mjs";
import { writeFileSync, readFileSync } from "node:fs";
import Job from "./Job.mjs";
var WorkerState;
(function (WorkerState) {
    WorkerState[WorkerState["READY"] = 0] = "READY";
    WorkerState[WorkerState["WORKING"] = 1] = "WORKING";
    WorkerState[WorkerState["SHUTDOWN"] = 2] = "SHUTDOWN";
})(WorkerState || (WorkerState = {}));
export default class Worker {
    log;
    logError;
    jobsList = [];
    taskList = [];
    state = WorkerState.READY;
    workPromise = undefined;
    taskListIdx = 0;
    name;
    constructor(name) {
        this.name = name;
        const logs = preLogs(`Worker-${name}`);
        this.log = logs.log;
        this.logError = logs.error;
    }
    static create(name) {
        return new Worker(name);
    }
    get jobs() {
        return [...this.jobsList];
    }
    tasks() {
        return TaskSequence.create(this.taskList);
    }
    async enqueueJob(job) {
        if (this.state === WorkerState.SHUTDOWN)
            return;
        if (this.taskList.length === 0)
            throw "No tasks added to work on this job. Make sure you setup your worker before queueing jobs";
        if (this.jobsList.includes(job))
            throw "Adding the same Job reference twice is not allowed.";
        this.jobsList.push(job);
        if (this.state !== WorkerState.WORKING) {
            this.state = WorkerState.WORKING;
            this.workPromise = this.doJobs();
        }
        await this.workPromise;
    }
    async doJobs() {
        while (this.jobsList.length > 0 && this.state !== WorkerState.SHUTDOWN) {
            let job = this.jobsList[0];
            let task = this.taskList[this.taskListIdx];
            while (this.taskListIdx < this.taskList.length && this.state !== WorkerState.SHUTDOWN) {
                this.log(`Doing task ${task.name} for job ${job.name}`);
                const jobUpdate = await task.doJob(job);
                this.log(`Finished task ${task.name} for job ${job.name}`);
                const taskUpdate = this.nextTask(jobUpdate);
                job = this.handleJobResult(jobUpdate);
                if (!this.canContinue(job))
                    break;
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
    handleJobResult(job) {
        if (job.state === JobState.FATAL_ERROR) {
            this.logError(`A fatal error occurred for job ${job.name}\n`, job.fatalErr, "\nWhile handling\n", job.err);
            return job;
        }
        if (job.state === JobState.ERROR) {
            this.logError(`An error occured for job ${job.name} and wasn't handled\n`, job.err);
            job = job.cancel();
            return job;
        }
        if (job.state === JobState.CANCELED) {
            this.log(`Job ${job.name} was canceled`);
            return job;
        }
        if (job.state === JobState.REPEAT_TASK || job.state === JobState.SKIP_TASK || job.state === JobState.WORKER_SHUTDOWN)
            job = job.okay();
        return job;
    }
    nextTask(job) {
        if (job.state === JobState.OKAY || job.state === JobState.SKIP_TASK)
            this.taskListIdx++;
        if (job.state === JobState.CANCELED || job.state === JobState.ERROR || job.state === JobState.FATAL_ERROR)
            this.taskListIdx = 0;
        return this.taskList[this.taskListIdx];
    }
    canContinue(job) {
        return job.state !== JobState.CANCELED && job.state !== JobState.ERROR && job.state !== JobState.FATAL_ERROR;
    }
    cancelJob(name) {
        for (let job of this.jobsList) {
            if (job.name === name)
                job.cancel();
        }
    }
    async shutdown() {
        this.state = WorkerState.SHUTDOWN;
        this.jobsList.forEach(job => { job.pause(); });
        await this.workPromise;
    }
    save(filePath) {
        let serializedJobs = this.jobsList.map(job => job.serialize());
        writeFileSync(filePath, JSON.stringify({
            name: this.name,
            pausedTaskName: this.taskList[this.taskListIdx].name,
            jobsList: serializedJobs
        }));
    }
    load(filePath) {
        const state = JSON.parse(readFileSync(filePath, { encoding: "utf-8" }));
        const jobList = [];
        const taskIdx = this.taskList.findIndex((task) => task.name === state.pausedTaskName);
        if (taskIdx === -1)
            throw `Unabled to find paused task ${state.pausedTaskName}. This might be due to not adding the tasks before loading the state file`;
        for (let { name, data, canceled } of state.jobsList) {
            jobList.push(Job.create(name, data, canceled));
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
