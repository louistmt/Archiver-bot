
import { JSONObject } from "../common.mjs";

export type Serialized = {
    classVersion: string
    data: JSONObject
}

export type SolveStrategy<T extends ISerializable> = (obj: Serialized, instance: T) => Serialized;

export interface ISerializable {
    serialize(): JSONObject
    load(data: JSONObject)
}

export interface IPirateChest<T extends ISerializable> {
    get(): T
    save()
}