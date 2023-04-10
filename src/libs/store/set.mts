import { readJSONFile, writeJSONFile, fileExists } from "../../utils.mjs"
import type { StorableValue, Savable } from "./object.mjs"

type StoredSet<T extends StorableValue> = Set<T> & Savable

export default function readStoredSet<T extends StorableValue>(filePath: string): StoredSet<T> {

    let list: T[]

    if (fileExists(filePath)) {
        list = readJSONFile(filePath)
    } else {
        list = []
    }

    let set: StoredSet<T> = (new Set(list)) as StoredSet<T>
    set.save = function save() {
        writeJSONFile(filePath, [...set])
    }

    return set
}