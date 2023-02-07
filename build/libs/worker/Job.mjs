import { JobState } from "./types.mjs";
export default class Job {
    name;
    data;
    err;
    fatalErr;
    state;
    constructor({ name, data, err = undefined, fatalErr = undefined, state = JobState.OKAY }) {
        this.name = name;
        this.data = data;
        this.err = err;
        this.fatalErr = fatalErr;
        this.state = state;
    }
    static create(name, data, state) {
        return new Job({ name, data, state });
    }
    updateState({ name, data, err, fatalErr, state }) {
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
        let { name, data } = this;
        if (this.isStateImmutable())
            return this.updateState({ err });
        return new Job({ name, data, err, state: JobState.ERROR });
    }
    fatal(err) {
        return this.updateState({ fatalErr: err, state: JobState.FATAL_ERROR });
    }
    repeatTask(data) {
        const { name, err } = this;
        if (this.isStateImmutable())
            return this.updateState({ data });
        return new Job({ name, data, err, state: JobState.REPEAT_TASK });
    }
    skipTask(data) {
        const { name, err } = this;
        if (this.isStateImmutable())
            return this.updateState({ data });
        return new Job({ name, data, err, state: JobState.SKIP_TASK });
    }
    from(data) {
        const { name, err, fatalErr, state } = this;
        return new Job({ name, data, err, fatalErr, state });
    }
    serialize() {
        return {
            name: this.name,
            data: this.data,
            state: this.state
        };
    }
}