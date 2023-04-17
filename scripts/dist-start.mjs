import startup from "../dist/index.mjs"
import client from "../dist/services/client.mjs"

await startup()

client.on("exit", () => {
    process.exit(0)
})