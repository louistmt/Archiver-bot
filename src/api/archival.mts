/**
 * Sub module containing the more complex API calls which
 * are composed of several subcalls
 */
import * as ChannelsAPI from "./channels.mjs";
import * as WebhooksAPI from "./webhooks.mjs";
import { avatarHashToUrl } from "../utils.mjs";
import { ChannelType } from "discord-api-types/v10.js"
import type { APITextChannel, APIGuildCategoryChannel } from "discord-api-types/v10.js";

const ARCHIVE_LIMIT = 500;
const CATEGORY_LIMIT = 50;

export class ArchivalError extends Error {
    static REPEATED_CATEGORIES = 2;
    static FULL = 3;
    static CATEGORY_FULL = 4;
    static NO_CATEGORY = 5;

    type: number;

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

class ServerChannelsInfo {
    /**
     * Total number of channes in the server
     */
    channelCount: number = 0;

    /**
     * A Mapping from category names to category ids.
     * If there are more than one category with the same name,
     * the last scanned category will be the one mapped.
     */
    catNamesIds: Map<string, string> = new Map();

    /**
     * Maps each text channel that has a category
     * to its category.
     */
    catTextChannels: Map<string, APITextChannel[]> = new Map();

    /**
     * Maps of each category per id
     */
    catChannels: Map<string, APIGuildCategoryChannel> = new Map();
}

export async function retrieveServerInfo(guildId: string): Promise<ServerChannelsInfo> {
    const serverInfo = new ServerChannelsInfo();

    const channels = await ChannelsAPI.getChannels(guildId);
    const textChannels = channels.filter((channel) => channel.type === ChannelType.GuildText) as APITextChannel[];
    const categoryChannels = channels.filter((channel) => channel.type === ChannelType.GuildCategory) as APIGuildCategoryChannel[];

    
    serverInfo.channelCount = channels.length;
    textChannels.forEach((channel) => {
        if (!channel.parent_id) return;

        if (!serverInfo.catTextChannels.has(channel.parent_id))
            serverInfo.catTextChannels.set(channel.parent_id, []);
        
        serverInfo.catTextChannels.get(channel.parent_id).push(channel)
    });
    categoryChannels.forEach((channel) => {
        serverInfo.catChannels.set(channel.id, channel)
        serverInfo.catNamesIds.set(channel.name, channel.id)
    });

    return serverInfo
}

/**
 * Retriveves and parses the Archive Data into a format
 * @param guildId
 * @throws {ArchivalError} When there is a network error or if there are repeated categories 
 */
export async function retrieveArchiveData(guildId: string) {

    const channels = await ChannelsAPI.getChannels(guildId);
    const catData = channels.filter((channel) => channel.type === ChannelType.GuildCategory);
    const chaData = channels.filter((channel) => channel.type === ChannelType.GuildText);

    
    const catIdsNames: Map<string, string> = new Map();
    const catNamesIds: Map<string, string> = new Map();

    for (let { id, name } of catData) {
        if (catNamesIds.has(name)) {
            throw new ArchivalError(ArchivalError.REPEATED_CATEGORIES, `Found repeated categories for name "${name}"`);
        }

        catNamesIds.set(name, id);
        catIdsNames.set(id, name);
    }

    const channelCount = catData.length + chaData.length;
    const categories: Map<string, string[]> = new Map();

    for (let { id } of catData) {
        const catName = catIdsNames.get(id);
        categories.set(catName, []);
    }

    for (let { id, parent_id } of chaData as APITextChannel[]) {
        if (!parent_id) continue;

        const catName = catIdsNames.get(parent_id);
        categories.get(catName).push(id)
    }

    return { channelCount, categories, catNamesIds };
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
export async function createArchiveChannel(guildId: string, categoryName: string, channelName: string) {

    // Retrieve archive server info
    const archiveServer = await retrieveArchiveData(guildId);

    if (archiveServer.channelCount == ARCHIVE_LIMIT) 
        throw new ArchivalError(ArchivalError.FULL, "The archival server is full");

    if (!archiveServer.catNamesIds.has(categoryName))
        throw new ArchivalError(ArchivalError.NO_CATEGORY, `Category "${categoryName}" does not exist`);
    
    if (archiveServer.categories.get(categoryName).length === CATEGORY_LIMIT)
        throw new ArchivalError(ArchivalError.CATEGORY_FULL, `Category "${categoryName}" is full`);

    const categoryId = archiveServer.catNamesIds.get(categoryName);
    const channel = await ChannelsAPI.createChannel(guildId, channelName, ChannelType.GuildText, categoryId);
    const channelId = channel.id;

    const webhook = await WebhooksAPI.createWebhook(channelId, channel.name);
    const webhookId = webhook.id;
    const webhookToken = webhook.token;

    return { channelId, webhookId, webhookToken };
}

/**
 * Retrieves all rp messages in a tidy format ready to be sent.
 * @param {string} targetChannelId The channel to retrieve the rp messages from
 * @returns {{avatarUrl: string, username: string, content: string}[]} The Rp messages
 */
export async function retrieveAllRpMessages(targetChannelId) {
    return (
        await ChannelsAPI.getAllWebhookMessages(targetChannelId)
    ).map(({ author, content }) => {
        return {
            avatarUrl: avatarHashToUrl(author.id, author.avatar),
            username: author.username,
            content: content.trim().length === 0 ? "." : content
        };
    });
}

/**
 * Retrieves all messages in a tidy format ready to be sent.
 * @param {string} targetChannelId The channel to retrieve the messages from
 * @returns {{avatarUrl: string, username: string, content: string}[]} The Messages
 */
export async function retrieveAllMessages(targetChannelId) {
    return (
        await ChannelsAPI.getAllChannelMessages(targetChannelId)
    ).map(({ author, content }) => {
        return {
            avatarUrl: avatarHashToUrl(author.id, author.avatar),
            username: author.username,
            content: content.trim().length === 0 ? "." : content
        };
    });
}