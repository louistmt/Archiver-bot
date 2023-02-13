import { IPirateChest, ISerializable, Serialized, SolveStrategy } from "./types.mjs";
import { createHash } from "node:crypto";
import { fileExists, preLogs, readJSONFile, writeJSONFile } from "../../utils.mjs";
import { JSONObject, md5Signature } from "../common.mjs";

const {log} = preLogs("PirateChest");

export class PirateChest<T extends ISerializable> implements IPirateChest<T> {
    private filePath: string
    private instance: T
    private conflictSolver: SolveStrategy<T>

    private constructor(filePath: string, instance: T, conflicSolver: SolveStrategy<T>) {
        this.filePath = filePath
        this.instance = instance
        this.conflictSolver = conflicSolver

        this.load()
    }

    static open<T extends ISerializable>(
        filePath: string, instance: T,
        conflictSolver: SolveStrategy<T> = DefaultSolveStrategies.throwError
    ): IPirateChest<T> {
        return new PirateChest<T>(filePath, instance, conflictSolver)
    }

    get(): T {
        return this.instance
    }

    private load() {
        const instance = this.instance
        const iClassVersion = md5Signature(instance.constructor.toString())
        let obj: Serialized;

        if (fileExists(this.filePath)) {
            obj = readJSONFile(this.filePath)
        } else {
            obj = {classVersion: iClassVersion, data: {}}
        }
        
        if (obj.classVersion !== iClassVersion) {
            let solvedObj = this.conflictSolver(obj, instance)
            writeJSONFile(this.filePath, solvedObj)
            obj = solvedObj
        }

        instance.load(obj.data)
        return instance
    }

    save() {
        const instance = this.instance
        const classVersion = md5Signature(instance.constructor.toString())
        const obj: Serialized = {classVersion, data: instance.serialize()} 
        writeJSONFile(this.filePath, obj)
    }

}

export class DefaultSerialization implements ISerializable {

    serialize(): JSONObject {
        return JSON.parse(JSON.stringify(this))
    }

    load(data: JSONObject) {
        for (let [key, value] of Object.entries(data)) {
            this[key] = value;
        }
    }

    static serialize(instance: Object): JSONObject {
        return JSON.parse(JSON.stringify(instance))
    }

    static load(instance: Object, data: JSONObject) {
        for (let [key, value] of Object.entries(data)) {
            instance[key] = value
        }
    }

}

export class DefaultSolveStrategies {
    static throwError<T extends ISerializable>(obj: Serialized, instance: T): Serialized {
        const iClassVersion = md5Signature(instance.constructor.toString())
        throw Error(`Instance of class '${instance.constructor.name}(classVersion: ${iClassVersion})' does not match classVersion '${obj.classVersion}'`);
    }

    static overwriteVersion<T extends ISerializable>(obj: Serialized, instance: T): Serialized {
        const classVersion = md5Signature(instance.constructor.toString())
        log(`Solved classVersion conflict by overwriting it. (${obj.classVersion})->(${classVersion})`);
        obj.classVersion = classVersion
        return obj
    }

    static overwriteAll<T extends ISerializable>(obj: Serialized, instance: T): Serialized {
        const classVersion = md5Signature(instance.constructor.toString())
        log(`Solved classVersion conflict by overwriting all of the data. (${obj.classVersion})->(${classVersion})`);
        obj.classVersion = classVersion
        obj.data = instance.serialize()
        return obj
    }
}

type SolveFn = (data: JSONObject) => JSONObject;
type VersionMapEntry = {toVersion: string, solve: SolveFn} 

export class ChestMigration<T extends ISerializable> {
    private versionMap: Map<string, VersionMapEntry> = new Map();

    addTarget(fromVersion: string, toVersion: string, solve: SolveFn) {
        if (this.versionMap.has(fromVersion)) throw Error(`Mapping from version ${fromVersion} already exists`);
        this.versionMap.set(fromVersion, {toVersion, solve});
    }

    buildSolver(): SolveStrategy<T> {
        const versionMap = this.versionMap;

        function solver(obj: Serialized, instance: T): Serialized {
            const targetVersion = md5Signature(instance.constructor.toString())
            let {data, classVersion} = obj;

            log(`Attempting to migrate from ${classVersion} to ${targetVersion}`);
            while (targetVersion !== classVersion) {
                if (!versionMap.has(classVersion)) throw Error(`Migration failed. Could to find solver for version ${classVersion}`);
                const {solve, toVersion} = versionMap.get(classVersion);
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
















