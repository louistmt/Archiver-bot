import { Sequelize, Model, DataTypes, InferAttributes, InferCreationAttributes } from "sequelize"
import Config from "../config.mjs"

export const sequelize = new Sequelize({
    database: "db",
    dialect: "sqlite",
    storage: Config.paths.sqlite3
})

interface ServersConfig extends Model<InferAttributes<ServersConfig>, InferCreationAttributes<ServersConfig>> {
    serverId: string
    archiveServerId: string
    logChannelId: string
}

export const ServersConfig = sequelize.define<ServersConfig>("ServersConfig", {
    serverId: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    archiveServerId: DataTypes.STRING,
    logChannelId: DataTypes.STRING
})

interface Jobs extends Model<InferAttributes<Jobs>, InferCreationAttributes<Jobs>> {
    jobId: string
    jobName: string
}

export const Jobs = sequelize.define<Jobs>("Jobs", {
    jobId: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    jobName: DataTypes.STRING
})

interface JobTasks extends Model<InferAttributes<JobTasks>, InferCreationAttributes<JobTasks>> {
    jobId: string
    taskName: string
    data: string
}

export const JobTasks = sequelize.define<JobTasks>("JobTasks", {
    jobId: DataTypes.STRING,
    taskName: DataTypes.STRING,
    data: DataTypes.TEXT
})

await sequelize.sync()