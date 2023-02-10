export default class TaskSequence {
    tasksMap = new Map();
    tasksList;
    constructor(tasksList) {
        this.tasksList = tasksList;
    }
    static create(tasksList) {
        return new TaskSequence(tasksList);
    }
    add(task) {
        if (this.tasksMap.has(task.name))
            throw `Task named '${task.name}' already exists`;
        this.tasksMap.set(task.name, task);
        this.tasksList.push(task);
        return this;
    }
}
