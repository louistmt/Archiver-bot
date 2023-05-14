/**
 * Sub module containing the more complex API calls which
 * are composed of several subcalls
 */
import { avatarHashToUrl } from "../utils.mjs";
import { ChannelType } from "discord-api-types/v10";
import Config from "../config.mjs";
import client from "./client.mjs";
const ARCHIVE_LIMIT = Config.archiveLimit;
const CATEGORY_LIMIT = Config.categoryLimit;
class ArchivalError extends Error {
    static REPEATED_CATEGORIES = 2;
    static FULL = 3;
    static CATEGORY_FULL = 4;
    static NO_CATEGORY = 5;
    type;
    /**
     * Constructor of an archival error
     * @param {number} type Type of the error
     * @param {string} msg The error message
     */
    constructor(type, msg) {
        super(msg);
        this.type = type;
    }
}
export { ArchivalError };
class ServerChannelsInfo {
    /**
     * Total number of channes in the server
     */
    channelCount = 0;
    /**
     * A Mapping from category names to category ids.
     * If there are more than one category with the same name,
     * the last scanned category will be the one mapped.
     */
    catNamesIds = new Map();
    /**
     * Maps each text channel that has a category
     * to its category.
     */
    catTextChannels = new Map();
    /**
     * Maps of each category per id
     */
    catChannels = new Map();
}
export async function retrieveServerInfo(guildId) {
    const serverInfo = new ServerChannelsInfo();
    const guild = await client.guilds.fetch(guildId);
    const channels = (await guild.channels.fetch()).map((value) => value);
    const textChannels = channels.filter((channel) => channel.type === ChannelType.GuildText);
    const categoryChannels = channels.filter((channel) => channel.type === ChannelType.GuildCategory);
    serverInfo.channelCount = channels.length;
    textChannels.forEach((channel) => {
        if (!channel.parentId)
            return;
        if (!serverInfo.catTextChannels.has(channel.parentId))
            serverInfo.catTextChannels.set(channel.parentId, []);
        serverInfo.catTextChannels.get(channel.parentId).push(channel);
    });
    categoryChannels.forEach((channel) => {
        serverInfo.catChannels.set(channel.id, channel);
        serverInfo.catNamesIds.set(channel.name, channel.id);
    });
    return serverInfo;
}
/**
 * Creates an archival channel.
 * @param guildId
 * @param categoryName
 * @param channelName
 * @returns {{channelId: string, webhookId: string, webhookToken: string}} Info about the archival channel
 * @throws When the archival server is full, when the category is full,
 * when there is no category, when there are repeated categories in the archival server,
 * or a network error.
 */
export async function createArchiveChannel(guildId, categoryName, channelName) {
    // Retrieve archive server info
    const archiveServer = await retrieveServerInfo(guildId);
    if (archiveServer.channelCount == ARCHIVE_LIMIT)
        throw new ArchivalError(ArchivalError.FULL, "The archival server is full");
    if (!archiveServer.catNamesIds.has(categoryName))
        throw new ArchivalError(ArchivalError.NO_CATEGORY, `Category "${categoryName}" does not exist`);
    if (archiveServer.catTextChannels.get(categoryName).length === CATEGORY_LIMIT)
        throw new ArchivalError(ArchivalError.CATEGORY_FULL, `Category "${categoryName}" is full`);
    const categoryId = archiveServer.catNamesIds.get(categoryName);
    const guild = await client.guilds.fetch(guildId);
    const channel = await guild.channels.create({ name: channelName, parent: categoryId, type: ChannelType.GuildText });
    const channelId = channel.id;
    const webhook = await channel.createWebhook({ name: channelName });
    const webhookId = webhook.id;
    const webhookToken = webhook.token;
    return { channelId, webhookId, webhookToken };
}
const mentionsRegex = /<@.*?>/gm;
/**
 * Retrieves all rp messages in a tidy format ready to be sent.
 * @param {string} targetChannelId The channel to retrieve the rp messages from
 * @returns {{avatarUrl: string, username: string, content: string}[]} The Rp messages
 */
export async function retrieveAllRpMessages(targetChannelId) {
    const channel = await client.channels.fetch(targetChannelId);
    const rawMessages = [];
    if (!channel.isTextBased())
        return [];
    let lastMsgCount = Infinity;
    let lastId = channel.lastMessageId;
    while (lastMsgCount > 0) {
        // @ts-ignore: This expression is not callable
        const msgs = (await channel.messages.fetch({ cache: false, before: lastId, limit: 100 })).mapValues((value) => value);
        lastMsgCount = msgs.length;
        lastId = msgs[msgs.length - 1].id;
        rawMessages.push(...msgs);
    }
    return rawMessages
        .filter(msg => msg.webhookId !== undefined)
        .map(({ author, content }) => {
        content = content.trim().length === 0 ? "." : content;
        content = content.replaceAll(mentionsRegex, ".");
        return {
            avatarUrl: avatarHashToUrl(author.id, author.avatar),
            username: author.username,
            content
        };
    });
}
export async function retrieveAllMessages(targetChannelId) {
    const channel = await client.channels.fetch(targetChannelId);
    const rawMessages = [];
    if (!channel.isTextBased())
        return [];
    let lastMsgCount = Infinity;
    let lastId = channel.lastMessageId;
    while (lastMsgCount > 0) {
        // @ts-ignore: This expression is not callable
        const msgs = (await channel.messages.fetch({ cache: false, before: lastId, limit: 100 })).mapValues((value) => value);
        lastMsgCount = msgs.length;
        lastId = msgs[msgs.length - 1].id;
        rawMessages.push(...msgs);
    }
    return rawMessages.map(({ author, content }) => {
        content = content.trim().length === 0 ? "." : content;
        content = content.replaceAll(mentionsRegex, ".");
        return {
            avatarUrl: avatarHashToUrl(author.id, author.avatar),
            username: author.username,
            content
        };
    });
}
