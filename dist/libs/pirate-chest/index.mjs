import { fileExists, preLogs, readJSONFile, writeJSONFile } from "../../utils.mjs";
import { md5Signature } from "../common.mjs";
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
        const iClassVersion = md5Signature(instance.constructor.toString());
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
        const classVersion = md5Signature(instance.constructor.toString());
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
        const iClassVersion = md5Signature(instance.constructor.toString());
        throw Error(`Instance of class '${instance.constructor.name}(classVersion: ${iClassVersion})' does not match classVersion '${obj.classVersion}'`);
    }
    static overwriteVersion(obj, instance) {
        const classVersion = md5Signature(instance.constructor.toString());
        log(`Solved classVersion conflict by overwriting it. (${obj.classVersion})->(${classVersion})`);
        obj.classVersion = classVersion;
        return obj;
    }
    static overwriteAll(obj, instance) {
        const classVersion = md5Signature(instance.constructor.toString());
        log(`Solved classVersion conflict by overwriting all of the data. (${obj.classVersion})->(${classVersion})`);
        obj.classVersion = classVersion;
        obj.data = instance.serialize();
        return obj;
    }
}
export class ChestMigration {
    versionMap = new Map();
    addTarget(fromVersion, toVersion, solve) {
        if (this.versionMap.has(fromVersion))
            throw Error(`Mapping from version ${fromVersion} already exists`);
        this.versionMap.set(fromVersion, { toVersion, solve });
    }
    buildSolver() {
        const versionMap = this.versionMap;
        function solver(obj, instance) {
            const targetVersion = md5Signature(instance.constructor.toString());
            let { data, classVersion } = obj;
            log(`Attempting to migrate from ${classVersion} to ${targetVersion}`);
            while (targetVersion !== classVersion) {
                if (!versionMap.has(classVersion))
                    throw Error(`Migration failed. Could to find solver for version ${classVersion}`);
                const { solve, toVersion } = versionMap.get(classVersion);
                log(`Migrating from version ${classVersion} to ${toVersion}`);
                data = solve(data);
                classVersion = toVersion;
            }
            log(`Migration to version ${targetVersion} successful`);
            obj.data = data;
            obj.classVersion = classVersion;
            return obj;
        }
        return solver;
    }
}
