import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import Config from "../config.mjs";
const rest = new REST({ version: '10' }).setToken(Config.token);
/**
 * Wrapper to create a webhook for a channel.
 */
export async function createWebhook(channelId, name) {
    const body = { name };
    return await rest.post(Routes.channelWebhooks(channelId), { body });
}
/**
 * Wrapper to get the channel webhooks.
 */
export async function getChannelWebhooks(channelId) {
    return await rest.get(Routes.channelWebhooks(channelId));
}
/**
 * Wrapper to post a message to a webhook.
 */
export async function postMessageToWebhook(webhookId, weebhookToken, avatarUrl, username, content) {
    const query = { wait: true };
    const body = {
        avatar_url: avatarUrl,
        username: username,
        content: content
    };
    return await rest.post(Routes.webhook(webhookId, weebhookToken), { query, body });
}
/**
 * Wrapper to delete a webhook.
 */
export async function deleteWebhook(webhookId) {
    await rest.delete(Routes.webhook(webhookId));
}
