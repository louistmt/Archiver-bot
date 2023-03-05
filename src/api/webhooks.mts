import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import type { APIWebhook, APIMessage } from "discord-api-types/v10";
import { delay } from "../utils.mjs";
 
import Config from "../config.mjs";

const rest = new REST({version: '10'}).setToken(Config.token);

/**
 * Wrapper to create a webhook for a channel.
 */
 export async function createWebhook(channelId: string, name: string): Promise<APIWebhook> {
    const body = {name};

    return await rest.post(
        Routes.channelWebhooks(channelId),
        {body}
    ) as APIWebhook;
}

/**
 * Wrapper to get the channel webhooks.
 */
export async function getChannelWebhooks(channelId: string): Promise<APIWebhook[]> {
    return await rest.get(Routes.channelWebhooks(channelId)) as APIWebhook[];
}

/**
 * Wrapper to post a message to a webhook.
 */
export async function postMessageToWebhook(
    webhookId: string, weebhookToken: string, avatarUrl: string, 
    username: string, content: string
): Promise<APIMessage> {

    const query = {wait: true} as unknown as URLSearchParams;
    const body = {
        avatar_url: avatarUrl,
        username: username,
        content: content
    };

    await delay(3 * 1000);
    return await rest.post(Routes.webhook(webhookId, weebhookToken), {query, body}) as APIMessage;
}

/**
 * Wrapper to delete a webhook.
 */
export async function deleteWebhook(webhookId: string): Promise<void> {
    await rest.delete(Routes.webhook(webhookId));
}