import { ITask, ITaskSequence } from "./types.mjs";
import { JSONObject } from "../common.mjs";

export default class TaskSequence<T extends JSONObject> implements ITaskSequence<T> {
    tasksMap: Map<string, ITask<JSONObject, JSONObject>> = new Map();
    tasksList: ITask<JSONObject, JSONObject>[];

    private constructor(tasksList: ITask<JSONObject, JSONObject>[]) {
        this.tasksList = tasksList;
    }

    static create<T extends JSONObject>(tasksList: ITask<JSONObject, JSONObject>[]): ITaskSequence<T> {
        return new TaskSequence(tasksList);
    }

    add<R extends JSONObject>(task: ITask<T, R>): ITaskSequence<R> {
        if (this.tasksMap.has(task.name)) throw `Task named '${task.name}' already exists`;
        this.tasksMap.set(task.name, task);
        this.tasksList.push(task);
        return this as unknown as ITaskSequence<R>;
    }
    
}