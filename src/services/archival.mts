/**
 * Sub module containing the more complex API calls which
 * are composed of several subcalls
 */
import { avatarHashToUrl } from "../utils.mjs"

import { ChannelType } from "discord-api-types/v10"
import Config from "../config.mjs"
import client from "./client.mjs"
import { CategoryChannel, Message, TextChannel } from "discord.js"
import { delay } from "../utils.mjs"

const ARCHIVE_LIMIT = Config.archiveLimit;
const CATEGORY_LIMIT = Config.categoryLimit;

export class ArchiveFullError extends Error { }
export class CategoryFullError extends Error { }
export class NoSuchCategoryError extends Error { }

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
    catTextChannels: Map<string, TextChannel[]> = new Map();

    /**
     * Maps of each category per id
     */
    catChannels: Map<string, CategoryChannel> = new Map();
}

export async function retrieveServerInfo(guildId: string): Promise<ServerChannelsInfo> {
    const serverInfo = new ServerChannelsInfo();

    const guild = await client.guilds.fetch(guildId)
    const channels = (await guild.channels.fetch()).map((value) => value)
    const textChannels = channels.filter((channel) => channel.type === ChannelType.GuildText) as TextChannel[]
    const categoryChannels = channels.filter((channel) => channel.type === ChannelType.GuildCategory) as CategoryChannel[]


    serverInfo.channelCount = channels.length;
    textChannels.forEach((channel) => {
        if (!channel.parentId) return;

        if (!serverInfo.catTextChannels.has(channel.parentId))
            serverInfo.catTextChannels.set(channel.parentId, []);

        serverInfo.catTextChannels.get(channel.parentId).push(channel)
    });
    categoryChannels.forEach((channel) => {
        serverInfo.catChannels.set(channel.id, channel)
        serverInfo.catNamesIds.set(channel.name, channel.id)
    });

    return serverInfo
}

/**
 * Creates an archival channel.
 * @param guildId
 * @param categoryName
 * @param channelName 
 * @returns Info about the archival channel
 * @throws When the archival server is full, when the category is full,
 * when there is no category, when there are repeated categories in the archival server,
 * or a network error.
 */
export async function createArchiveChannel(guildId: string, categoryName: string, channelName: string) {

    // Retrieve archive server info
    const archiveServer = await retrieveServerInfo(guildId);

    if (archiveServer.channelCount == ARCHIVE_LIMIT)
        throw new ArchiveFullError("The archival server is full")

    if (!archiveServer.catNamesIds.has(categoryName))
        throw new NoSuchCategoryError(`Category "${categoryName}" does not exist`)

    if (archiveServer.catTextChannels.get(categoryName).length === CATEGORY_LIMIT)
        throw new CategoryFullError(`Category "${categoryName}" is full`)

    const categoryId = archiveServer.catNamesIds.get(categoryName)
    const guild = await client.guilds.fetch(guildId)
    const channel = await guild.channels.create({ name: channelName, parent: categoryId, type: ChannelType.GuildText })
    const channelId = channel.id;

    const webhook = await channel.createWebhook({ name: channelName })
    const webhookId = webhook.id;
    const webhookToken = webhook.token;

    return { channelId, webhookId, webhookToken };
}

const mentionsRegex = /<@.*?>/gm
/**
 * Retrieves all rp messages in a tidy format ready to be sent.
 * @param targetId The channel to retrieve the rp messages from
 * @returns The Rp messages
 */
export async function retrieveAllBotMessages(targetId: string) {
    const channel = await client.channels.fetch(targetId)
    const rawMessages: Message[] = []

    if (!channel.isTextBased()) return []

    let lastMsgCount = Infinity
    let lastId = channel.lastMessageId
    // Fetch the first message since it won't be included in subsquent requests
    rawMessages.push(await channel.messages.fetch(lastId))
    while (lastMsgCount > 0) {
        await delay(2 * 1000)
        // @ts-ignore: This expression is not callable
        const msgs: Message[] = (await channel.messages.fetch({ cache: false, before: lastId, limit: 100 })).map((value) => value)
        if (msgs.length === 0) break
        lastMsgCount = msgs.length
        lastId = msgs[msgs.length - 1].id
        rawMessages.push(...msgs)
    }

    return rawMessages
        .filter(msg => msg.webhookId !== undefined)
        .map(({ author, content }) => {
            content = content.trim().length === 0 ? "." : content
            content = content.replaceAll(mentionsRegex, ".")

            return {
                avatarUrl: avatarHashToUrl(author.id, author.avatar),
                username: author.username,
                content
            }
        })
        .reverse()
}


export async function retrieveAllMessages(targetId: string): Promise<{ avatarUrl: string, username: string, content: string }[]> {
    const channel = await client.channels.fetch(targetId)
    const rawMessages: Message[] = []

    if (!channel.isTextBased()) return []

    let lastMsgCount = Infinity
    let lastId = channel.lastMessageId
    // Fetch the first message since it won't be included in subsquent requests
    rawMessages.push(await channel.messages.fetch(lastId))
    while (lastMsgCount > 0) {
        await delay(2 * 1000)
        // @ts-ignore: This expression is not callable
        const msgs: Message[] = (await channel.messages.fetch({ cache: false, before: lastId, limit: 100 })).map((value) => value)
        if (msgs.length === 0) break
        lastMsgCount = msgs.length
        lastId = msgs[msgs.length - 1].id
        rawMessages.push(...msgs)
    }

    return rawMessages
        .map(({ author, content }) => {
            content = content.trim().length === 0 ? "." : content
            content = content.replaceAll(mentionsRegex, ".")

            return {
                avatarUrl: avatarHashToUrl(author.id, author.avatar),
                username: author.username,
                content
            }
        })
        .reverse()
}


export async function retrieveMessagesRange(targetId: string, startId: string, stopId: string): Promise<{ avatarUrl: string, username: string, content: string }[]> {
    const channel = await client.channels.fetch(targetId)
    const rawMessages: Message[] = []

    if (!channel.isTextBased()) return []

    let lastMsgCount = Infinity
    let lastId = startId
    // Fetch the first message since it won't be included in subsquent requests
    rawMessages.push(await channel.messages.fetch(lastId))
    while (lastMsgCount > 0) {
        await delay(2 * 1000)
        lastMsgCount = 0
        // @ts-ignore: This expression is not callable
        const msgs: Message[] = (await channel.messages.fetch({ cache: false, before: lastId, limit: 100 })).map((value) => value)
        if (msgs.length === 0) break

        for (let msg of msgs) {
            lastMsgCount += 1
            rawMessages.push(msg)
            if (msg.id === stopId) break
        }

        lastId = msgs[lastMsgCount - 1].id
    }

    return rawMessages.map(({ author, content }) => {
        content = content.trim().length === 0 ? "." : content
        content = content.replaceAll(mentionsRegex, ".")

        return {
            avatarUrl: avatarHashToUrl(author.id, author.avatar),
            username: author.username,
            content
        }
    }).reverse()
}