import type { EmbedBuilder, APIEmbedField, Message } from 'discord.js';
import MessageCommand from '../lib/base/MessageCommand';
import { EMOJIS } from '../lib/constants';
import prisma from '../lib/db';
import { createEmbed } from '../lib/embed';
import { getRepliedMessage } from '../lib/utilities/message';
import { paginationEmbed } from '../lib/utilities/pagination';
import { getDeleteButton } from '../lib/utilities/buttons';

const bmCreateRegex =
    /^([^,]+)(?:,\s*(https:\/\/discord\.com\/channels\/(?:@me|\d+)\/\d+\/\d+))?$/;

const urlRegex =
    /https:\/\/discord\.com\/channels\/(@me|[0-9]+)\/([0-9]+)\/([0-9]+)/;

const getMsg = async (messageUrl: string) => {
    const [_, guildId, channelId, messageId] = urlRegex.exec(messageUrl)!;

    if (!guildId || !channelId || !messageId) return null;

    const channel = client.channels.cache.get(channelId);
    if (!channel) return null;

    if (!channel.isTextBased()) return null;

    const message = await channel.messages.fetch(messageId);
    if (!message) return null;

    return message;
};

export const getBookmarkContent = (message: Message) => {
    const cnt = message.content;

    if (cnt.length > 0) return cnt;

    const embeds = message.embeds ?? [];

    return embeds.reduce((acc, embed) => {
        let _acc = acc;
        if (embed.description) _acc += `${embed.description}\n`;
        if (embed.fields) {
            for (const field of embed.fields) {
                _acc += `${field.name}\n${field.value}\n`;
            }
        }

        return _acc;
    }, '');
};

const queryRegex = /^([^,]+)(?:,\s*(tag|content))?$/;

export const commands = [
    new MessageCommand({
        name: 'bookmark-create',
        description: 'Create a bookmark',
        aliases: ['bookmark-add', 'bc', 'bmcr'],
        help: 'bookmark-create <tag>, <message-url?>',
        execute: async (message, args) => {
            try {
                const [_, tag, messageUrl] =
                    args.join(' ').match(bmCreateRegex) ?? [];

                if (!tag) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('Invalid Arguments')
                                .setDescription('Please provide a tag')
                        ]
                    });
                }

                const msg =
                    (await getRepliedMessage(message)) ??
                    (messageUrl ? await getMsg(messageUrl) : null);

                if (!msg) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('Invalid Arguments')
                                .setDescription(
                                    'You need to reply to a message or provide a message URL to add bookmark'
                                )
                        ]
                    });
                }

                const content = getBookmarkContent(msg);

                if (content.length === 0) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('Invalid Arguments')
                                .setDescription(
                                    'The message to be bookmarked is empty'
                                )
                        ]
                    });
                }

                const deleteButtons = getDeleteButton(message.author);

                await prisma.bookmark.create({
                    data: {
                        tag: tag.trim(),
                        content: content,
                        messageUrl: msg.url,
                        userId: message.author.id
                    }
                });

                await message.author.send({
                    embeds: [
                        createEmbed('info', message.author)
                            .setTitle('Bookmark Created')
                            .setDescription('Bookmark created successfully')
                            .addFields({
                                name: 'Tag',
                                value: tag.trim()
                            })
                            .addFields({
                                name: 'Content',
                                value: content
                            })
                            .addFields({
                                name: 'Message URL',
                                value: msg.url
                            })
                    ],
                    components: [deleteButtons]
                });

                await message.react(EMOJIS.bookmark);
            } catch (error) {
                await message.reply({
                    embeds: [
                        createEmbed('error', message.author)
                            .setTitle('Error')
                            .setDescription(
                                'An error occurred while creating the bookmark'
                            )
                    ]
                });
                throw error;
            }
        }
    }),
    new MessageCommand({
        name: 'bookmark-list',
        description: 'List all bookmarks',
        aliases: ['bookmark-ls', 'bls'],
        help: 'bookmark-list <id> | <tag>',
        execute: async (message, args) => {
            try {
                const idOrTag = args.join(' ');

                const isID = /^\d+$/.test(idOrTag);

                const bookmarks = await prisma.bookmark.findMany({
                    where: {
                        userId: message.author.id,
                        ...(idOrTag.length > 0
                            ? isID
                                ? { id: Number.parseInt(idOrTag) }
                                : { tag: idOrTag }
                            : {})
                    }
                });

                if (bookmarks.length === 0) {
                    return await message.reply({
                        embeds: [
                            createEmbed('info', message.author)
                                .setTitle('No Bookmarks Found')
                                .setDescription(
                                    'No bookmarks found with the provided ID or tag'
                                )
                        ]
                    });
                }

                const embeds: EmbedBuilder[] = [];

                const fields: APIEmbedField[] = bookmarks.map((bookmark) => ({
                    name: `ID: ${bookmark.id} | Tag: ${bookmark.tag}`,
                    value: `${bookmark.content}\n[Jump to message](${bookmark.messageUrl})`
                }));

                const pageSize = 4;

                for (let i = 0; i < fields.length; i += pageSize) {
                    const embed = createEmbed('info', message.author)
                        .setTitle('Bookmarks')
                        .addFields(fields.slice(i, i + pageSize));

                    embeds.push(embed);
                }

                await paginationEmbed(message, embeds);
            } catch (error) {
                await message.reply({
                    embeds: [
                        createEmbed('error', message.author)
                            .setTitle('Error')
                            .setDescription(
                                'An error occurred while listing the bookmarks'
                            )
                    ]
                });
                throw error;
            }
        }
    }),
    new MessageCommand({
        name: 'bookmark-query',
        description: 'Query bookmarks by a search string',
        aliases: ['bookmark-query', 'bq'],
        help: 'bookmark-query <query>, <type>',
        execute: async (message, args) => {
            try {
                const [_, query, type] = args.join(' ').match(queryRegex) ?? [];

                if (!query) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('Invalid Arguments')
                                .setDescription('Please provide a query')
                        ]
                    });
                }

                const bookmarks = await prisma.bookmark.findMany({
                    where: {
                        userId: message.author.id,
                        [type === 'tag' ? 'tag' : 'content']: {
                            contains: query
                        }
                    }
                });

                if (bookmarks.length === 0) {
                    return await message.reply({
                        embeds: [
                            createEmbed('info', message.author)
                                .setTitle('No Bookmarks Found')
                                .setDescription(
                                    'No bookmarks found with the provided ID or tag'
                                )
                        ]
                    });
                }

                const embeds: EmbedBuilder[] = [];

                const fields: APIEmbedField[] = bookmarks.map((bookmark) => ({
                    name: `ID: ${bookmark.id} | Tag: ${bookmark.tag}`,
                    value: `${bookmark.content}\n[Jump to message](${bookmark.messageUrl})`
                }));

                const pageSize = 4;

                for (let i = 0; i < fields.length; i += pageSize) {
                    const embed = createEmbed('info', message.author)
                        .setTitle('Bookmarks')
                        .addFields(fields.slice(i, i + pageSize));

                    embeds.push(embed);
                }

                await paginationEmbed(message, embeds);
            } catch (error) {
                await message.reply({
                    embeds: [
                        createEmbed('error', message.author)
                            .setTitle('Error')
                            .setDescription(
                                'An error occurred while querying the bookmarks'
                            )
                    ]
                });
                throw error;
            }
        }
    }),
    new MessageCommand({
        name: 'bookmark-delete',
        description: 'Delete a bookmark',
        aliases: ['bookmark-del', 'bd'],
        help: 'bookmark-delete <id>',
        execute: async (message, args) => {
            try {
                if (args.length === 0) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('Invalid Arguments')
                                .setDescription('Please provide an ID')
                        ]
                    });
                }

                const id = Number.parseInt(args[0]!);

                if (Number.isNaN(id)) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('Invalid Arguments')
                                .setDescription('Please provide a valid ID')
                        ]
                    });
                }

                const bookmark = await prisma.bookmark.findFirst({
                    where: {
                        id,
                        userId: message.author.id
                    }
                });

                if (!bookmark) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('Invalid Arguments')
                                .setDescription(
                                    'No bookmark found with the provided ID'
                                )
                        ]
                    });
                }

                await prisma.bookmark.delete({
                    where: {
                        id,
                        userId: message.author.id
                    }
                });

                await message.react(EMOJIS.bin);
            } catch (error) {
                await message.reply({
                    embeds: [
                        createEmbed('error', message.author)
                            .setTitle('Error')
                            .setDescription(
                                'An error occurred while deleting the bookmark'
                            )
                    ]
                });
                throw error;
            }
        }
    })
];
