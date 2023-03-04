import { JobState } from "./types.mjs";
export default class Job {
    /**
     * Used to distinguish jobs may have similar procedures but
     * require slight tweaks
     */
    tag;
    name;
    data;
    err;
    fatalErr;
    state;
    constructor({ name, data, err = undefined, fatalErr = undefined, tag = "", state = JobState.OKAY }) {
        this.tag = tag;
        this.name = name;
        this.data = data;
        this.err = err;
        this.fatalErr = fatalErr;
        this.state = state;
    }
    static create(name, data, tag, state) {
        return new Job({ name, data, tag, state });
    }
    updateState({ tag, name, data, err, fatalErr, state }) {
        this.tag = tag ?? this.tag;
        this.name = name ?? this.name;
        this.data = data ?? this.data;
        this.err = err ?? this.err;
        this.fatalErr = fatalErr ?? this.fatalErr;
        this.state = state ?? this.state;
        return this;
    }
    isStateImmutable() {
        return this.state === JobState.CANCELED || this.state === JobState.FATAL_ERROR;
    }
    okay() {
        if (this.isStateImmutable())
            return this;
        return this.updateState({ state: JobState.OKAY });
    }
    pause() {
        if (this.isStateImmutable())
            return this;
        this.state = JobState.WORKER_SHUTDOWN;
        return this;
    }
    cancel() {
        if (this.isStateImmutable())
            return this;
        this.state = JobState.CANCELED;
        return this;
    }
    error(err) {
        let { name, data, tag } = this;
        if (this.isStateImmutable())
            return this.updateState({ err });
        return new Job({ name, data, tag, err, state: JobState.ERROR });
    }
    fatal(err) {
        return this.updateState({ fatalErr: err, state: JobState.FATAL_ERROR });
    }
    repeatTask(data) {
        const { name, err, tag } = this;
        if (this.isStateImmutable())
            return this.updateState({ data });
        return new Job({ name, data, tag, err, state: JobState.REPEAT_TASK });
    }
    skipTask(data) {
        const { name, err, tag } = this;
        if (this.isStateImmutable())
            return this.updateState({ data });
        return new Job({ name, data, tag, err, state: JobState.SKIP_TASK });
    }
    from(data) {
        const { name, err, tag, fatalErr, state } = this;
        return new Job({ name, data, tag, err, fatalErr, state });
    }
    serialize() {
        return {
            name: this.name,
            data: this.data,
            state: this.state,
            tag: this.tag
        };
    }
}
