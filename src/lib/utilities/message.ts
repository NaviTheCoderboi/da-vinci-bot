import type { Message } from 'discord.js';

export const getRepliedMessage = async (message: Message) => {
    const msgId = message.reference?.messageId;

    if (!msgId) return null;

    return await message.channel.messages.fetch(msgId);
};

export const getImages = (message: Message) => {
    const attachments = message.attachments.map((attachment) => attachment.url);

    if (attachments.length > 0) return attachments;

    const images: string[] = [];
    for (const embed of message.embeds ?? []) {
        if (embed.image) images.push(embed.image.url);
        if (embed.thumbnail) images.push(embed.thumbnail.url);
        if (embed.footer?.iconURL) images.push(embed.footer.iconURL);
    }

    return images;
};
