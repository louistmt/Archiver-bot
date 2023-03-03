export { default as Worker } from "./Worker.mjs";
export { default as Task } from "./Task.mjs";
export { default as Job } from "./Job.mjs";
export { JobState } from "./types.mjs";
export function createMultiTagFunction(...fns) {
    const fnsMap = new Map();
    for (let { tag, fn } of fns) {
        if (fnsMap.has(tag))
            throw Error(`There can't be two functions for the same tag (${tag})`);
        fnsMap.set(tag, fn);
    }
    return function workFunction(job) {
        if (!fnsMap.has(job.tag))
            throw Error(`No work function for tag ${job.tag}`);
        return fnsMap.get(job.tag)(job);
    };
}
