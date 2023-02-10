import { createHash } from "node:crypto";
import { fileExists, preLogs, readJSONFile, writeJSONFile } from "../../utils.mjs";
const { log } = preLogs("PirateChest");
export class PirateChest {
    filePath;
    instance;
    conflictSolver;
    constructor(filePath, instance, conflicSolver) {
        this.filePath = filePath;
        this.instance = instance;
        this.conflictSolver = conflicSolver;
        this.load();
    }
    static open(filePath, instance, conflictSolver = DefaultSolveStrategies.throwError) {
        return new PirateChest(filePath, instance, conflictSolver);
    }
    get() {
        return this.instance;
    }
    load() {
        const instance = this.instance;
        const iClassBytes = Buffer.from(instance.constructor.toString());
        const iClassVersion = createHash("md5").update(iClassBytes).digest("hex");
        let obj;
        if (fileExists(this.filePath)) {
            obj = readJSONFile(this.filePath);
        }
        else {
            obj = { classVersion: iClassVersion, data: {} };
        }
        if (obj.classVersion !== iClassVersion) {
            let solvedObj = this.conflictSolver(obj, instance);
            writeJSONFile(this.filePath, solvedObj);
            obj = solvedObj;
        }
        instance.load(obj.data);
        return instance;
    }
    save() {
        const instance = this.instance;
        const classBytes = Buffer.from(instance.constructor.toString());
        const classVersion = createHash("md5").update(classBytes).digest("hex");
        const obj = { classVersion, data: instance.serialize() };
        writeJSONFile(this.filePath, obj);
    }
}
export class DefaultSerialization {
    serialize() {
        return JSON.parse(JSON.stringify(this));
    }
    load(data) {
        for (let [key, value] of Object.entries(data)) {
            this[key] = value;
        }
    }
    static serialize(instance) {
        return JSON.parse(JSON.stringify(instance));
    }
    static load(instance, data) {
        for (let [key, value] of Object.entries(data)) {
            instance[key] = value;
        }
    }
}
export class DefaultSolveStrategies {
    static throwError(obj, instance) {
        const iClassBytes = Buffer.from(instance.constructor.toString());
        const iClassVersion = createHash("md5").update(iClassBytes).digest("hex");
        throw Error(`Instance of class '${instance.constructor.name}(classVersion: ${iClassVersion})' does not match classVersion '${obj.classVersion}'`);
    }
    static overwriteVersion(obj, instance) {
        const classBytes = Buffer.from(instance.constructor.toString());
        const classVersion = createHash("md5").update(classBytes).digest("hex");
        log(`Solved classVersion conflict by overwriting it. (${obj.classVersion})->(${classVersion})`);
        obj.classVersion = classVersion;
        return obj;
    }
    static overwriteAll(obj, instance) {
        const classBytes = Buffer.from(instance.constructor.toString());
        const classVersion = createHash("md5").update(classBytes).digest("hex");
        log(`Solved classVersion conflict by overwriting all of the data. (${obj.classVersion})->(${classVersion})`);
        obj.classVersion = classVersion;
        obj.data = instance.serialize();
        return obj;
    }
}
