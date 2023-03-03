type RpMessage = {
    avatarUrl: string;
    username: string;
    content: string;
};

export type ExportJob = {
    srcChannelId: string;
    srcChannelName: string;

    destinationChannel?: string;
    destinationUser?: string;
};

export type SendJob = {
    srcChannelId: string;
    srcChannelName: string;
    fileName: string;
    messages: RpMessage[];

    destinationChannelId?: string;
    destinationUserId?: string;
};