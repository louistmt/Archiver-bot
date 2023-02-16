import { IPirateChest, ISerializable, Serialized, SolveStrategy } from "./types.mjs";
import { fileExists, preLogs, readJSONFile, writeJSONFile } from "../../utils.mjs";
import { JSONObject, md5Signature } from "../common.mjs";


const { log } = preLogs("PirateChest");

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
        const iClassVersion = instance.version
        const iClassSignature = md5Signature(instance.constructor.toString())
        let obj: Serialized;

        if (fileExists(this.filePath)) {
            obj = readJSONFile(this.filePath)
        } else {
            obj = { classVersion: iClassVersion, classSignature: iClassSignature, data: {} }
        }

        if (obj.classSignature !== iClassSignature) obj = this.solveConflict(obj, instance)

        instance.load(obj.data)
        return instance
    }

    private solveConflict(obj: Serialized, instance: T): Serialized {
        if (obj.classVersion === instance.version) throw Error("The class signature does not match however both have the same version. Report this bug to the developer");
        const solvedObj = this.conflictSolver(obj, instance)
        writeJSONFile(this.filePath, solvedObj)
        return solvedObj
    }

    save() {
        const instance = this.instance
        const classSignature = md5Signature(instance.constructor.toString())
        const obj: Serialized = { classVersion: instance.version, classSignature, data: instance.serialize() }
        writeJSONFile(this.filePath, obj)
    }

}


export class DefaultSolveStrategies {
    static throwError<T extends ISerializable>(obj: Serialized, instance: T): Serialized {
        const iClassVersion = md5Signature(instance.constructor.toString())
        throw Error(`Instance of class '${instance.constructor.name}(classVersion: ${iClassVersion})' does not match classVersion '${obj.classVersion}'`);
    }

    static overwriteVersion<T extends ISerializable>(obj: Serialized, instance: T): Serialized {
        const classSignature = md5Signature(instance.constructor.toString())
        log(`Solved classVersion conflict by overwriting it. (${obj.classVersion})->(${instance.version})`);
        obj.classVersion = instance.version
        obj.classSignature = classSignature
        return obj
    }

    static overwriteAll<T extends ISerializable>(obj: Serialized, instance: T): Serialized {
        const classSignature = md5Signature(instance.constructor.toString())
        log(`Solved classVersion conflict by overwriting all of the data. (${obj.classVersion})->(${instance.version})`);
        obj.classVersion = instance.version
        obj.classSignature = classSignature
        obj.data = instance.serialize()
        return obj
    }
}


type SolveFn = (data: JSONObject) => JSONObject
type VersionMapEntry = { toVersion: number, solve: SolveFn }

export class ChestMigration<T extends ISerializable> {
    private versionMap: Map<number, VersionMapEntry> = new Map()

    addTarget(fromVersion: number, toVersion: number, solve: SolveFn) {
        if (this.versionMap.has(fromVersion)) throw Error(`Mapping from version ${fromVersion} already exists`)
        this.versionMap.set(fromVersion, { toVersion, solve })
    }

    buildSolver(): SolveStrategy<T> {
        const versionMap = this.versionMap

        function solver(obj: Serialized, instance: T): Serialized {
            const targetSignature = md5Signature(instance.constructor.toString())
            const targetVersion = instance.version
            let { data, classVersion } = obj

            log(`Attempting to migrate from ${classVersion} to ${targetVersion}`)
            while (targetVersion !== classVersion) {
                if (!versionMap.has(classVersion)) throw Error(`Migration failed. Could to find solver for version ${classVersion}`)
                const { solve, toVersion } = versionMap.get(classVersion)
                log(`Migrating from version ${classVersion} to ${toVersion}`)
                data = solve(data)
                classVersion = toVersion
            }

            log(`Migration to version ${targetVersion} successful`)
            obj.data = data
            obj.classSignature = targetSignature
            obj.classVersion = classVersion
            return obj
        }

        return solver
    }
}
















