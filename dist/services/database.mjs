import { Sequelize, DataTypes } from "sequelize";
import Config from "../config.mjs";
export const sequelize = new Sequelize({
    database: "db",
    dialect: "sqlite",
    logging: false,
    storage: Config.paths.sqlite3
});
export const ServersConfig = sequelize.define("ServersConfig", {
    serverId: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    archiveServerId: DataTypes.STRING,
    logChannelId: DataTypes.STRING
});
export const Jobs = sequelize.define("Jobs", {
    jobId: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    jobName: DataTypes.STRING
});
export const JobTasks = sequelize.define("JobTasks", {
    jobId: DataTypes.STRING,
    taskName: DataTypes.STRING,
    data: DataTypes.TEXT
});
await sequelize.sync();
