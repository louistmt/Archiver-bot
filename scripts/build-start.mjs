import startup from "../build/index.mjs"
import client from "../build/services/client.mjs"

await startup()

client.on("exit", () => {
    process.exit(0)
})