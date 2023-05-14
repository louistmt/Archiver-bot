
/**
 * An message present in a channel
 */
interface Message {
    avatarUrl: string,
    username: string,
    content: string
}

/**
 * Represents a server currently being used for archival
 * An Archival server is expected to have the following
 * structure
 * 
 * - channel
 * - channel
 * - ...
 * 
 * - category
 *   - channel
 *   - channel
 *   - ...
 * 
 * - category
 *   - channel
 *   - channel
 *   - ...
 * 
 * - ...
 */
export interface IArchiveServer {
    updateInfo(): Promise<void>

    getCategoriesByName(name: string): {id: string, name: string}[]
    getCategoryById(id: string): {id: string, name: string}
    getCategoryChannels(categoryId: string): {id: string, name: string}

    isServerFull(): boolean
    isCategoryFull(categoryId: string): boolean
    createNewCategory(name: string): Promise<{id: string, name: string}>
    createNewArchivalChannel(): Promise<{id: string, name: string, webhookId: string, webhookToken: string}>
}

/**
 * Represents a Source Server
 */
export interface ISourceServer {
    retrieveAllBotMessages(channelId: string): Promise<Message[]>
    retrieveAllMessages(channelId: string): Promise<Message[]>
    retrieveAllBotMessageRange(channelId: string, fromMsg: string, toMsg: string): Promise<Message[]>
    retrieveAllMessageRange(channelId: string, fromMsg: string, toMsg: string): Promise<Message[]>
}