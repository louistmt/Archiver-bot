import {accessSync, constants, readFileSync, writeFileSync, openSync, closeSync} from "node:fs";

/**
 * Used to create a multiline string until indentation for multiline strings
 * is properly handled.
 * @param  {...string} lines 
 */
export function multiline(...lines) {
    return lines.join("\n");
}

/**
 * Capitalizes the first letter of a string
 * @param str The string to capitalize
 */
export function capitalize(str: string): string {
    const characters = str.split("");
    characters[0] = characters[0].toUpperCase();
    return characters.join("");
}

/**
 * Returns a promise that solves after the specified amount of time.
 * @param {number} duration Time in miliseconds.
 * @returns 
 */
 export function delay(duration) {
    return new Promise((resolve) => {
        // console.log("Delaying");
        setTimeout(resolve, duration);
    });
}

/**
 * Converts a avatar hash of a user into a CDN url that allows to retrieve the avatar of the user.
 * @param {string} userId
 * @param {string} hash 
 */
 export function avatarHashToUrl(userId, hash) {
    return `https://cdn.discordapp.com/avatars/${userId}/${hash}`;
}

/**
 * Parses a channel mention into a channel id.
 * @param {string} data 
 */
 export function parseChannelMentionToId(data) {
    return data.replace("<#", "").replace(">", "");
}


/**
 * Parses a user mention into a user id
 * @param {string} data 
 */
 export function parseUserMentionToId(data) {
    return data.replace("<@", "").replace("!", "").replace(">", "");
}


/**
 * Small wrapper used to fix the issue of the SIGINT handler being called twice.
 * @param {Function} func 
 */
export function singleCallFix(func) {
    let called = false;

    function singleCall() {
        if (!called) {
            called = true;
            return func(arguments);  
        }
    }

    return singleCall;
}

/**
 * Creates a wrapper around the console.log function
 * that prepends a prefix
 * @param {string} prefix 
 */
export function prefixedLog(prefix) {
    return (...msg) => console.log(`[${prefix}]:`, ...msg);
}

/**
 * Creates a wrapper around the console.error function
 * that prepends a prefix
 * @param {string} prefix 
 */
export function prefixedError(prefix) {
    return (...msg) => console.error(`[${prefix}]:`, ...msg);
}


/**
 * Creates several wrapper functions for console.log,
 * console.error and others.
 * @param {string} prefix Prefix name to appear with the log message.
 */
export function preLogs(prefix) {
    const time = () => (new Date()).toTimeString().split(' ')[0];
    const log = (...args) => console.log(`[${time()} ${prefix}]:`, ...args);
    const error = (...args) => console.error(`[${time()} ${prefix}]:`, ...args);

    return {log, error};
}


/**
 * Contains several time constants
 * around the milisecond unit and functions
 * to calculate intervals of time.
 */
export const TimeUnits = {
    second: 1000,
    minute: 1000 * 60,
    hour: 1000 * 60 * 60,
    day: 1000 * 60 * 60 * 24,
    /**
     * Returns the specified amount of seconds in miliseconds.
     * @param {number} amount 
     */
    seconds: (amount) => amount * 1000,
    /**
     * Returns the specified amount of minutes in miliseconds.
     * @param {number} amount 
     */
    minutes: (amount) => amount * 1000 * 60,
     /**
     * Returns the specified amount of hours in miliseconds.
     * @param {number} amount 
     */
    hours: (amount) => amount * 1000 * 60 * 60,
    /**
     * Returns the specified amount of days in miliseconds.
     * @param {number} amount 
     */
    days: (amount) => amount * 1000 * 60 * 60 * 24
};

/**
 * Checks if the file exists and has read and write permissions
 * @param {string} path Path to check
 * @returns True if it exists and false otherwise
 */
export function fileExists(path) {
    try {
        accessSync(path, constants.R_OK | constants.W_OK)
        return true;
    } catch (err){
        return false;
    }
}

export function createFile(path) {
    closeSync(openSync(path, "w"));
}

/**
 * Reads the file at the specified path and returns it as a JSON Object
 * @param {string} path Path to the file
 * @returns {Object} The JSON Object
 */
export function readJSONFile(path) {
    return JSON.parse(readFileSync(path, {encoding: "utf-8"}))
}

/**
 * Write an obj to a JSON file
 * @param {string} path Path to the file
 * @param {Object} obj The object to save 
 */
export function writeJSONFile(path, obj) {
    return writeFileSync(path, JSON.stringify(obj, undefined, 4), {encoding: "utf-8"})
}

/**
 * @param {Map} map The map to convert
 * @returns {Object} The object resulted from the map
 */
export function mapToObject(map) {
    const obj = {};

    for (let [key, value] of map) {
        obj[key] = value;
    }

    return obj;
}

/**
 * @param {Object} obj The object to convert
 * @returns {Map} The map resulted from the object
 */
export function objectToMap(obj) {
    const map = new Map();

    for (let key in obj) {
        map.set(key, obj[key]);
    }

    return map;
}

/**
 * @param {Set} set The set to convert 
 * @returns {[]} The array resulted from the set
 */
export function setToArray(set) {
    const array = [];

    for (let item of set) {
        array.push(item);
    }

    return array;
}

/**
 * 
 * @param {[]} array The array to convert
 * @returns {Set} The set resulted from the array
 */
export function arrayToSet(array) {
    const set = new Set();

    for (let item of array) {
        set.add(item);
    }

    return set;
}