import Config from "../config.mjs";
import { PirateChest } from "../libs/pirate-chest/index.mjs";
class ServersConfig {
    configMap = new Map();
    getOrCreate(serverId) {
        if (!this.configMap.has(serverId))
            this.configMap.set(serverId, { privileged: new Set(), archiveServerId: "", logChannelId: "" });
        return this.configMap.get(serverId);
    }
    serialize() {
        const obj = {};
        for (let [serverId, { privileged: privilegedSet, archiveServerId, logChannelId }] of this.configMap) {
            let privileged = [...privilegedSet];
            obj[serverId] = { privileged, archiveServerId, logChannelId };
        }
        return obj;
    }
    load(data) {
        for (let key in data) {
            const privilegedList = data[key].privileged;
            const { archiveServerId } = data[key];
            const { logChannelId } = data[key];
            this.configMap.set(key, { privileged: new Set(privilegedList), archiveServerId, logChannelId });
        }
    }
}
const ServersConfigChest = PirateChest.open(Config.paths.serversConfig, new ServersConfig());
export default ServersConfigChest;
