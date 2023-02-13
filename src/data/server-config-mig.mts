import { ChestMigration } from "../libs/pirate-chest/index.mjs";
import ServersConfig from "./server-config.mjs";

const migration = new ChestMigration<ServersConfig>();

migration.addTarget("dd9f90c17cd45079e1fa0c83c08f5a2c", "64e7261bb4d0ed561e85a8dccca592f1", (data) => {
    const newData = {};

    for (const key in data) {
        const {archiveServerId, logChannelId} = data[key] as {archiveServerId: string, logChannelId: string};
        newData[key] = {archiveServerId, logChannelId};
    }

    return newData;
});

const solver = migration.buildSolver();
export default solver;