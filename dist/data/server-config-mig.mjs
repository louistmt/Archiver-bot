import { ChestMigration } from "../libs/pirate-chest/index.mjs";
const migration = new ChestMigration();
migration.addTarget(1, 2, (data) => {
    const newData = {};
    for (const key in data) {
        const { archiveServerId, logChannelId } = data[key];
        newData[key] = { archiveServerId, logChannelId };
    }
    return newData;
});
const solver = migration.buildSolver();
export default solver;
