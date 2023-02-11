import { createHash } from "node:crypto";
/**
 * Wrapper to calculate the md5 hash of a string
 * @param str
 */
export function md5Signature(str) {
    return createHash("md5").update(Buffer.from(str)).digest("hex");
}
