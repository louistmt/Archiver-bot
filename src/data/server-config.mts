import { ISerializable } from "../libs/pirate-chest/types.mjs";
import { JSONObject } from "../libs/common.mjs";

type ServerConfig = {
    archiveServerId: string
    logChannelId: string
};

export default class ServersConfig implements ISerializable {
    version: number = 2;
    configMap: Map<string, ServerConfig> = new Map();

    getOrCreate(serverId: string): ServerConfig {
        if (!this.configMap.has(serverId)) this.configMap.set(serverId, { archiveServerId: "", logChannelId: "" })
        return this.configMap.get(serverId)
    }

    serialize(): JSONObject {
        const obj: JSONObject = {};
        for (let [serverId, { archiveServerId, logChannelId }] of this.configMap) {
            obj[serverId] = { archiveServerId, logChannelId };
        }

        return obj;
    }

    load(data: JSONObject) {
        for (let key in data) {
            const { archiveServerId } = data[key] as any;
            const { logChannelId } = data[key] as any;
            this.configMap.set(key, { archiveServerId, logChannelId });
        }
    }
}