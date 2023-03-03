export default class ServersConfig {
    version = 2;
    configMap = new Map();
    getOrCreate(serverId) {
        if (!this.configMap.has(serverId))
            this.configMap.set(serverId, { archiveServerId: "", logChannelId: "" });
        return this.configMap.get(serverId);
    }
    serialize() {
        const obj = {};
        for (let [serverId, { archiveServerId, logChannelId }] of this.configMap) {
            obj[serverId] = { archiveServerId, logChannelId };
        }
        return obj;
    }
    load(data) {
        for (let key in data) {
            const { archiveServerId } = data[key];
            const { logChannelId } = data[key];
            this.configMap.set(key, { archiveServerId, logChannelId });
        }
    }
}
