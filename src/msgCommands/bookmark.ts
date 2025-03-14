import type { APIEmbedField } from 'discord.js';
import MessageCommand from '../lib/base/MessageCommand';
import { EMOJIS } from '../lib/constants';
import prisma from '../lib/db';
import { createEmbed } from '../lib/embed';
import { getRepliedMessage } from '../lib/utilities/message';
import { paginationEmbed } from '../lib/utilities/pagination';

export const commands = [
    new MessageCommand({
        name: 'boomark-create',
        description: 'Create a bookmark',
        aliases: ['bookmark-create', 'bookmark-add', 'bc', 'bmcr'],
        help: 'bookmark-create <title>, <message-id?>, <tags?> or bookmark-create <title>, <tags?>, <message-id?>',
        execute: async (message, args) => {
            try {
                const argsRegex =
                    /^([^,]+)(?:,\s*([0-9]+|[^,0-9][^,]*(?:;\s*[^,;]+)*|[^,0-9][^,]*(?:;[^,;]+)*))?,?\s*([0-9]+|[^,0-9][^,]*(?:;\s*[^,;]+)*|[^,0-9][^,]*(?:;[^,;]+)*)?$/;
                const match = argsRegex.exec(args.join(' '));

                if (!match) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('Invalid arguments')
                                .setDescription(
                                    'Please provide the title of the bookmark and optionally a message id and tags. Format is `<title>, <message-id?>, <tags?>` or `<title>, <tags?>, <message-id?>`. Tags are in format `tag1; tag2; tag3` or `tag1;tag2;tag3`. For example: \n - `bookmark-create My bookmark, 123456789012345678, tag1; tag2`.'
                                )
                        ]
                    });
                }

                const title = match[1]?.trim();

                if (!title) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('Invalid arguments')
                                .setDescription(
                                    'Please provide the title of the bookmark.'
                                )
                        ]
                    });
                }

                let tags = null;
                let messageId = null;

                const part2 = match[2] ? match[2].trim() : null;
                const part3 = match[3] ? match[3].trim() : null;

                const isMessageId = (str: string) => str && /^\d+$/.test(str);
                const isTags = (str: string) =>
                    str && (str.includes(';') || !/^\d+$/.test(str));

                if (part2 && isMessageId(part2)) {
                    messageId = part2;
                    if (part3 && isTags(part3)) {
                        tags = part3;
                    }
                } else if (part2 && isTags(part2)) {
                    tags = part2;
                    if (part3 && isMessageId(part3)) {
                        messageId = part3;
                    }
                } else if (part3 && isMessageId(part3)) {
                    messageId = part3;
                } else if (part3 && isTags(part3)) {
                    tags = part3;
                }

                const tagArray = tags
                    ? tags.split(/;\s*/).filter((tag) => tag.length > 0)
                    : [];

                const _repliedMessage = await getRepliedMessage(message);

                const repliedMessageOrMessageIDProvided =
                    _repliedMessage ?? messageId;

                if (!repliedMessageOrMessageIDProvided) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('No message to bookmark')
                                .setDescription(
                                    'You need to reply to a message to bookmark it. If you want to bookmark a message by id, please provide the message id.'
                                )
                        ]
                    });
                }

                const repliedMessage =
                    _repliedMessage ??
                    // @ts-ignore
                    (await message.channel.messages.fetch(messageId));

                const content =
                    repliedMessage.content.length === 0
                        ? repliedMessage.embeds.length > 0
                            ? (repliedMessage.embeds[0]?.description ?? null)
                            : null
                        : repliedMessage.content;

                if (!content || content.length === 0) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('No content to bookmark')
                                .setDescription(
                                    'The message you are trying to bookmark has no content or embed description.'
                                )
                        ]
                    });
                }

                await prisma.bookmark.create({
                    data: {
                        title,
                        messageUrl: repliedMessage.url,
                        content: content,
                        tags: tagArray ?? [],
                        userId: message.author.id
                    }
                });

                await message.react(EMOJIS.bookmark);
            } catch (error) {
                await message.reply({
                    embeds: [
                        createEmbed('error', message.author)
                            .setTitle('Error creating bookmark')
                            .setDescription(
                                'An error occurred while creating the bookmark.'
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
        aliases: ['bookmark-list', 'bookmark-ls', 'bls'],
        help: 'bookmark-list <query?>',
        execute: async (message, args) => {
            try {
                const query = args.join(' ');
                const hasQuery = query.length > 0;

                const bookmarks = await prisma.bookmark.findMany({
                    where: {
                        userId: message.author.id,
                        ...(hasQuery
                            ? {
                                  title: {
                                      contains: query
                                  }
                              }
                            : {})
                    }
                });

                if (bookmarks.length === 0) {
                    return await message.reply({
                        embeds: [
                            createEmbed('info', message.author)
                                .setTitle('No bookmarks')
                                .setDescription('You have no bookmarks.')
                        ]
                    });
                }

                const formattedTags = (tags: string[]) => {
                    return tags.length > 0
                        ? `\`${tags.join(', ')}\``
                        : 'No tags';
                };

                const fields: APIEmbedField[] = bookmarks.map((bookmark) => ({
                    name: `(${bookmark.id}) ${bookmark.title} - ${bookmark.messageUrl}`,
                    value: `${bookmark.content}\n\n\`${formattedTags(bookmark.tags as any)}\``,
                    inline: false
                }));

                const pageSize = 4;
                const embeds = [];
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
                            .setTitle('Error listing bookmarks')
                            .setDescription(
                                'An error occurred while listing the bookmarks.'
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
        aliases: ['bookmark-delete', 'bookmark-del', 'bd', 'bmdel'],
        help: 'bookmark-delete <id>',
        execute: async (message, args) => {
            try {
                const bookmarkId = args[0];

                if (!bookmarkId || !/^\d+$/.test(bookmarkId)) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('Invalid arguments')
                                .setDescription(
                                    'Please provide the id of the bookmark to delete.'
                                )
                        ]
                    });
                }

                const bookmark = await prisma.bookmark.findFirst({
                    where: {
                        id: Number.parseInt(bookmarkId),
                        userId: message.author.id
                    }
                });

                if (!bookmark) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('Bookmark not found')
                                .setDescription(
                                    'The bookmark with the provided id was not found.'
                                )
                        ]
                    });
                }

                await prisma.bookmark.delete({
                    where: {
                        id: Number.parseInt(bookmarkId)
                    }
                });

                await message.react(EMOJIS.bin);
            } catch (error) {
                await message.reply({
                    embeds: [
                        createEmbed('error', message.author)
                            .setTitle('Error deleting bookmark')
                            .setDescription(
                                'An error occurred while deleting the bookmark.'
                            )
                    ]
                });
                throw error;
            }
        }
    })
];
