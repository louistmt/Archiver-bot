/**
 * Wrapper functions for API Calls related to channels
 */
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { delay } from "../utils.mjs";
import { APIMessage, ChannelType } from "discord-api-types/v10";
import type { 
    APIChannel,
    APIGroupDMChannel,
    APIDMChannel,
    APITextChannel,
    APINewsChannel,
    APIVoiceChannel,
	APIGuildCategoryChannel,
	APIThreadChannel
} from "discord-api-types/v10";

import Config from "../config.mjs";
import { JSONObject } from "../libs/common.mjs";

type ChannelTypeMap = {
    [ChannelType.DM]: APIDMChannel
    [ChannelType.GroupDM]: APIGroupDMChannel,
    [ChannelType.GuildText]: APITextChannel,
    [ChannelType.GuildNews]: APINewsChannel,
    [ChannelType.GuildVoice]: APIVoiceChannel,
    [ChannelType.GuildCategory]: APIGuildCategoryChannel,
    [ChannelType.GuildPublicThread]: APIThreadChannel
};

type PartialChannelTypes = keyof ChannelTypeMap;

const timeUnit = {
    ms: 1,
    s: 1000
};

const rest = new REST({ version: '10' }).setToken(Config.token);

/**
 * Wrapper to create a new channel.
 * @param guildId Id of the guild where one wishes to create the channel.
 * @param name Name of the next channel.
 * @param type Type of channel.
 * @param parentId Id of the parent category.
 */
export async function createChannel<K extends PartialChannelTypes>(
    guildId: string, name: string, type_: K,
    parentId: string = undefined
): Promise<ChannelTypeMap[K]> {
    const body: JSONObject = { name, type_ };

    if (parentId !== undefined) {
        body.parent_id = parentId;
    }

    return await rest.post(
        Routes.guildChannels(guildId),
        { body }
    ) as ChannelTypeMap[K];
}

/**
 * Wrapper to delete a channel from a server.
 * @param id Id of the channel
 */
export async function deleteChannel(id: string): Promise<APIChannel> {
    return await rest.delete(Routes.channel(id)) as APIChannel;
}

/**
 * Wrapper to retrieve info of a channel 
 * @param id Id of the channel
 */
export async function getChannel(id: string): Promise<APIChannel> {
    return await rest.get(Routes.channel(id)) as APIChannel;
}

/**
 * Wrapper to get a list of channels of a server.
 * @param guildId The id of the server.
 * @param type An optional parameter to filter the channels
 */
export async function getChannels<K extends PartialChannelTypes>(guildId: string, type: K = undefined): Promise<ChannelTypeMap[K][]> {
    const channels = await rest.get(Routes.guildChannels(guildId)) as any[];

    if (type === null || type === undefined) return channels;

    return channels.filter((channel) => channel.type === type) as ChannelTypeMap[K][];
}

/**
 * Wrapper to get messages contained in a particular channel.
 * The first message returned is the latest one sent in the channel.
 * @param channelId 
 * @param beforeId 
 * @param limit 
 */
export async function getChannelMessages(
    channelId: string, beforeId: string = undefined, limit: number = 100
): Promise<APIMessage[]> {
    // console.log(beforeId);

    const query = new URLSearchParams();
    query.set("limit", `${limit}`);

    if (beforeId !== undefined)
        query.set("before", beforeId);

    return await rest.get(Routes.channelMessages(channelId), { query }) as APIMessage[];
}

/**
 * Gets all of the messages in a channel. This function introduces an
 * artificial delay to avoid spamming the endpoint.
 * It returns the messages in reversed order. This means the message
 * with the lowest index is the first one
 * @param channelId 
 */
export async function getAllChannelMessages(channelId: string): Promise<APIMessage[]> {
    let lastMsgCount = Infinity;
    let beforeId = undefined;
    const aggreMsgs = [];

    while (lastMsgCount > 0) {
        await delay(2 * timeUnit.s);

        const messages = await getChannelMessages(channelId, beforeId);

        lastMsgCount = messages.length;
        beforeId = messages[messages.length - 1]?.id;
        aggreMsgs.push(...messages);
    }

    return aggreMsgs.reverse();
}

/**
 * Retrives all messages in a channel by webhooks
 * @param channelId 
 */
export async function getAllWebhookMessages(channelId: string): Promise<APIMessage[]> {
    const messages = await getAllChannelMessages(channelId);

    return messages.filter(messages => messages.webhook_id !== undefined);
}

/**
 * Wrapper to send a message to a channel.
 */
export async function postMessage(channelId: string, content: string): Promise<APIMessage> {
    const body = { content };

    return await rest.post(Routes.channelMessages(channelId), { body }) as APIMessage;
}