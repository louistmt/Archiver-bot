// Let's try to capture calls into console.log and console.error
const log = []
const logMaxSize = 100
const originalOutWrite = process.stdout.write.bind(process.stdout)
const originalErrWrite = process.stderr.write.bind(process.stderr)
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

import * as https from "https"
import express from "express"
import startup from "../dist/index.mjs"

const PORT = 10101
const app = express()
const scriptStartTime = Date.now()

app.get("/", (req, res) => {
    const timePassed = Date.now() - scriptStartTime
    const hours = Math.floor(timePassed / (1000 * 60 * 60))
    const remainderMinutes = timePassed % (1000 * 60 * 60)
    const minutes = Math.floor(remainderMinutes / (1000 * 60))
    const remainderSeconds = remainderMinutes % (1000 * 60)
    const seconds = Math.floor(remainderSeconds / 1000)

    const formatedTime = `${hours >= 10 ? hours : "0" + hours}:${minutes >= 10 ? minutes : "0" + minutes}:${seconds >= 10 ? seconds : "0" + seconds}`
    res.type("text/plain").send(`Bot has been on since ${formatedTime}`)
})
app.get("/log", (req, res) => {
    res.type("text/plain").send(log.join(""))
})

// Ping repl to try to keep it up at least until the next reset
setInterval(() => {
    https.get("https://archiver-bot.luisferreira.repl.co", (res) => {
        console.log(`Pinged self at ${(new Date()).toUTCString()}`)
        res.resume()
    })
}, 1000 * 60 * 15)

// Start up the bot
await startup()

app.listen(PORT, () => {
    console.log(`App is up at port ${PORT}`)
})