import Config from "../config.mjs";
import { PirateChest } from "../libs/pirate-chest/index.mjs";
import { ISerializable } from "../libs/pirate-chest/types.mjs";
import { JSONObject } from "../libs/common.mjs";

type ServerConfig = {
    privileged: Set<string>
    archiveServerId: string
    logChannelId: string
};

class ServersConfig implements ISerializable {
    configMap: Map<string, ServerConfig> = new Map();

    getOrCreate(serverId: string): ServerConfig {
        if (!this.configMap.has(serverId)) this.configMap.set(serverId, { privileged: new Set(), archiveServerId: "", logChannelId: "" })
        return this.configMap.get(serverId)
    }

    serialize(): JSONObject {
        const obj: JSONObject = {};
        for (let [serverId, { privileged: privilegedSet, archiveServerId, logChannelId }] of this.configMap) {
            let privileged = [...privilegedSet];
            obj[serverId] = { privileged, archiveServerId, logChannelId };
        }

        return obj;
    }

    load(data: JSONObject) {
        for (let key in data) {
            const privilegedList = (data[key] as any).privileged;
            const { archiveServerId } = data[key] as any;
            const { logChannelId } = data[key] as any;
            this.configMap.set(key, { privileged: new Set(privilegedList), archiveServerId, logChannelId });
        }
    }
}

const ServersConfigChest = PirateChest.open<ServersConfig>(Config.paths.serversConfig, new ServersConfig())

export default ServersConfigChest;