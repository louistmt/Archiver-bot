import { fileExists, readJSONFile, writeJSONFile } from "../../utils.mjs"

export type StorableType = null | number | boolean | string
export type StorableObject = {
    [k: string]: StorableType | StorableObject | (StorableType | StorableObject)[]
};
export type StorableValue = StorableObject | StorableType
export type StorableList = StorableValue[]
export type Storable = StorableList | StorableObject
export type Savable = {
    /**
     * Saves the object to file
     */
    save(): void
};

export type StoredObject<T extends Storable> = T & Savable

export default function readStoredObject<T extends Storable>(filePath: string): StoredObject<T> {
    let  instance: StoredObject<T>

    if (fileExists(filePath)) {
        instance = readJSONFile(filePath)
    } else {
        instance = {} as StoredObject<T>
    }

    instance.save = function save() {
        writeJSONFile(filePath, instance)
    }

    return instance
}