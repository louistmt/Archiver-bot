import { ChestMigration } from "../libs/pirate-chest-deprecated/index.mjs";
import ServersConfig from "./server-config.mjs";

const migration = new ChestMigration<ServersConfig>();

migration.addTarget(1, 2, (data) => {
    const newData = {};

    for (const key in data) {
        const {archiveServerId, logChannelId} = data[key] as {archiveServerId: string, logChannelId: string};
        newData[key] = {archiveServerId, logChannelId};
    }

    return newData;
});

const solver = migration.buildSolver();
export default solver;