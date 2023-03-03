import { JSONObject } from "../common.mjs";
import { IJob, JobState } from "./types.mjs";

type JobOptions<T extends JSONObject> = {
    /**
     * Used to distinguish jobs may have similar procedures but
     * require slight tweaks
     */
    tag?: string
    name?: string
    data?: T
    err?: any
    fatalErr?: any
    state?: JobState
}

export default class Job<T extends JSONObject> implements IJob<T> {
    /**
     * Used to distinguish jobs may have similar procedures but
     * require slight tweaks
     */
    tag: string;
    name: string;
    data: T;
    err: any;
    fatalErr: any;
    state: JobState;

    private constructor({
        name, data,
        err = undefined, fatalErr = undefined, tag = "",
        state = JobState.OKAY
    }: JobOptions<T>) {
        this.tag = tag;
        this.name = name;
        this.data = data;
        this.err = err;
        this.fatalErr = fatalErr;
        this.state = state;
    }

    static create<T extends JSONObject>(name: string, data: T, tag?:string, state?: JobState): IJob<T> {
        return new Job({ name, data, tag, state });
    }

    private updateState<R extends JSONObject>({ tag, name, data, err, fatalErr, state }: JobOptions<R>): Job<R> {
        this.tag = tag ?? this.tag;
        this.name = name ?? this.name;
        this.data = data as any ?? this.data;
        this.err = err ?? this.err;
        this.fatalErr = fatalErr ?? this.fatalErr;
        this.state = state ?? this.state;
        return this as unknown as Job<R>;
    }

    isStateImmutable(): boolean {
        return this.state === JobState.CANCELED || this.state === JobState.FATAL_ERROR;
    }

    okay(): IJob<T> {
        if (this.isStateImmutable()) return this;
        return this.updateState({state: JobState.OKAY});
    }

    pause(): IJob<T> {
        if (this.isStateImmutable()) return this;
        this.state = JobState.WORKER_SHUTDOWN
        return this;
    }

    cancel(): IJob<T> {
        if (this.isStateImmutable()) return this;
        this.state = JobState.CANCELED;
        return this;
    }

    error(err: any): IJob<T> {
        let { name, data, tag } = this;
        if (this.isStateImmutable()) return this.updateState<T>({ err });
        return new Job({ name, data, tag, err, state: JobState.ERROR });
    }

    fatal(err: any): IJob<T> {
        return this.updateState({fatalErr: err, state: JobState.FATAL_ERROR});
    }

    repeatTask(data: T): IJob<T> {
        const { name, err, tag } = this;
        if (this.isStateImmutable()) return this.updateState<T>({data});
        return new Job({ name, data, tag, err, state: JobState.REPEAT_TASK });
    }

    skipTask<R extends JSONObject>(data: R): IJob<R> {
        const { name, err, tag } = this;
        if (this.isStateImmutable()) return this.updateState<R>({data});
        return new Job<R>({ name, data, tag, err, state: JobState.SKIP_TASK });
    }

    from<R extends JSONObject>(data: R): IJob<R> {
        const { name, err, tag, fatalErr, state } = this;
        return new Job({ name, data, tag, err, fatalErr, state });
    }

    serialize(): JSONObject {
        return {
            name: this.name,
            data: this.data,
            state: this.state,
            tag: this.tag
        }
    }

}