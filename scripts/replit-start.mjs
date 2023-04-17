// Let's try to capture calls into console.log and console.error
const log = []
const logMaxSize = 100
const originalOutWrite = process.stdout.write
const originalErrWrite = process.stderr.write
process.stdout.write = (data, cb) => {
    if (log.length > logMaxSize) log.shift()
    log.push(data)
    originalOutWrite(data, cb)
}
process.stderr.write = (data, cb) => {
    if (log.length > logMaxSize) log.shift()
    log.push(data)
    originalOutWrite(data, cb)
}

import { request } from "https"
import express from "express"
import startup from "../dist/index.mjs"

const PORT = 9091
const app = express()
const scriptStartTime = Date.now()

app.get("/", (req, res) => {
    const hours = Math.floor(scriptStartTime / (1000 * 60 * 60))
    const remainderMinutes = scriptStartTime % (1000 * 60 * 60)
    const minutes = Math.floor(remainderMinutes / (1000 * 60))
    const remainderSeconds = remainderMinutes % (1000 * 60)
    const seconds = Math.floor(scriptStartTime / 1000)

    const formatedTime = `${hours >= 10 ? 10 : "0" + hours}:${minutes >= 10 ? 10 : "0" + minutes}:${seconds >= 10 ? 10 : "0" + seconds}`
    res.type("text/plain").send(`Bot has been on since ${formatedTime}`)
})
app.get("/log", (req, res) => {
    res.type("text/plain").send(log.join(""))
})

await startup()

app.listen(PORT, () => {
    console.log(`App is up at port ${PORT}`)
})