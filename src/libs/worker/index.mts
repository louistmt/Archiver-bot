import { JSONObject } from "../common.mjs";
import type { IJob, WorkFunction } from "./types.mjs";

export {default as Worker} from "./Worker.mjs";
export {default as Task} from "./Task.mjs";
export {default as Job} from "./Job.mjs";

export { JobState, IJob, ITask, IWorker} from "./types.mjs";

export function createMultiTagFunction<T extends JSONObject, R extends JSONObject>(
    ...fns: {tag: string, fn: WorkFunction<T, R>}[]
): WorkFunction<T, R> {
    const fnsMap: Map<string, WorkFunction<T, R>> = new Map();

    for (let {tag, fn} of fns) {
        if (fnsMap.has(tag)) throw Error(`There can't be two functions for the same tag (${tag})`);
        fnsMap.set(tag, fn);
    }

    return function workFunction(job: IJob<T>): Promise<IJob<R>> {
        if (!fnsMap.has(job.tag)) throw Error(`No work function for tag ${job.tag}`);
        return fnsMap.get(job.tag)(job);
    }
}