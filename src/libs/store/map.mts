import { fileExists, readJSONFile, writeJSONFile } from "../../utils.mjs";
import type { StorableValue, Savable } from "./object.mjs";

type StoredMap<T extends StorableValue> = Map<string, T> & Savable;

export default function readStoredMap<T extends StorableValue>(filePath: string): StoredMap<T> {
    let list: [string, T][]

    if (fileExists(filePath)) {
        list = readJSONFile(filePath)
    } else {
        list = []
    }

    let map = new Map<string, T>(list) as StoredMap<T>
    map.save = function save() {
        writeJSONFile(filePath, [...map])
    }

    return map
}