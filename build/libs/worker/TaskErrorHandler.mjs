export default class TaskErrorHandler {
    errorMap = new Map();
    defaultHandler = async (job) => job;
    constructor() { }
    static create() {
        return new TaskErrorHandler();
    }
    key(fn) {
        this.keyFn = fn;
    }
    match(key, handler) {
        if (this.errorMap.has(key))
            throw Error(`Handler for key '${key}' already exists`);
        this.errorMap.set(key, handler);
        return this;
    }
    default(handler) {
        this.defaultHandler = handler;
    }
    keyFn = (err) => undefined;
    async handle(job) {
        try {
            const key = this.keyFn(job.err);
            const handler = this.errorMap.get(key) ?? this.defaultHandler;
            return await handler(job);
        }
        catch (anotherErr) {
            return job.fatal(anotherErr);
        }
    }
}
