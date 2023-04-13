import { fileExists, readJSONFile, writeJSONFile } from "../../utils.mjs";
import * as path from "node:path";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { StorableValue, Savable } from "./object.mjs";

type StoredQueue<T extends StorableValue> = {
    /**
     * Push an item to the bottom of the queue.
     * @param items 
     */
    enqueue(...items: T[]): void

    /**
     * Peek at the top item of the queue. This
     * does not advance the queue.
     */
    peek(): T | undefined
    /**
     * Pops the item at the top of the queue. This
     * advances the queue if the queue isn't empty.
     */
    dequeue(): T | undefined
} & Savable

const QUEUE_FILE = "queue"
const TRACKER_FILE = "tracker"

export default function readStoredQueue<T extends StorableValue>(dirPath: string): StoredQueue<T> {
    let queue: T[] = []
    let tracker: number = 0
    let queueFlag: boolean = false
    let trackerFlag: boolean = false
    let queueFilePath = path.join(dirPath, QUEUE_FILE)
    let trackerFilePath = path.join(dirPath, TRACKER_FILE)

    if (fileExists(dirPath)) {
        queue = readJSONFile(queueFilePath)
        tracker = parseInt(readFileSync(trackerFilePath, {encoding: "utf-8"}))
    } else {
        mkdirSync(dirPath)
    }

    let storedQueue: StoredQueue<T> = {
        enqueue(...items) {
            queue.push(...items)
            queueFlag = true
        },

        peek() {
            return queue[tracker]
        },

        dequeue() {
            trackerFlag = true
            return queue[tracker++]
        },

        save() {
            if (queueFlag) {
                writeJSONFile(queueFilePath, queue)
                writeFileSync(trackerFilePath, "0", {encoding: "utf-8"})
                tracker = 0
            } else if (trackerFlag) {
                writeFileSync(trackerFilePath, `${tracker}`, {encoding: "utf-8"})
            }

            trackerFlag = false
            queueFlag = false
        }
    };

    return storedQueue;
}