import { Sequelize, Model, DataTypes } from "sequelize"
import Config from "../config.mjs"

const sequelize = new Sequelize({
    database: "db",
    dialect: "sqlite",
    storage: Config.paths.sqlite3
})

const ServersConfig = sequelize.define("ServersConfig", {
    serverId: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    archiveServerId: DataTypes.STRING,
    logChannelId: DataTypes.STRING
})

const ArchiveJobs = sequelize.define("ArchiveJobs", {
    jobId: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    srcServerId: DataTypes.STRING,
    srcChannelId: DataTypes.STRING,
    srcChannelName: DataTypes.STRING,
    destServerId: DataTypes.STRING,
    destChannelId: DataTypes.STRING,
    destChannelName: DataTypes.STRING
})

const ArchiveTasks = sequelize.define("ArchiveTasks", {
    jobId: DataTypes.STRING,
    taskName: DataTypes.STRING,
    data: DataTypes.STRING
})

const ExportJobs = sequelize.define("ExportJobs", {
    jobId: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    format: DataTypes.STRING,
    srcChannelId: DataTypes.STRING,
    srcChannelName: DataTypes.STRING,
    destChannelId: DataTypes.STRING
})

await sequelize.sync()