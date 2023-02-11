import { createHash } from "node:crypto";


type JSONLike = null | number | string | boolean

export type JSONObject = {
    [k: string]: JSONLike | JSONObject | (JSONLike | JSONObject)[]
}

export type JSONType = JSONObject | (JSONLike | JSONObject)[]

/**
 * Wrapper to calculate the md5 hash of a string
 * @param str
 */
export function md5Signature(str: string): string {
    return createHash("md5").update(Buffer.from(str)).digest("hex")
}