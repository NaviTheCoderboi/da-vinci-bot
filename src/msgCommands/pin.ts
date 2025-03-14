import { ChannelType } from 'discord.js';
import MessageCommand from '../lib/base/MessageCommand';
import { createEmbed } from '../lib/embed';
import { getRepliedMessage } from '../lib/utilities/message';
import { EMOJIS } from '../lib/constants';

export const commands = [
    new MessageCommand({
        name: 'pin',
        description: 'Pin a message',
        aliases: ['pin'],
        help: '',
        execute: async (message) => {
            if (
                message.channel.type === ChannelType.DM ||
                message.channel.type === ChannelType.GroupDM
            )
                return;

            const messageToPin = await getRepliedMessage(message);

            if (!messageToPin) {
                return await message.reply({
                    embeds: [
                        createEmbed('error', message.author)
                            .setTitle('No message to pin')
                            .setDescription(
                                'You need to reply to a message to pin it.'
                            )
                    ]
                });
            }

            const perms = message.channel.permissionsFor(message.member!);
            if (!perms?.has('ManageMessages')) {
                return await message.reply({
                    embeds: [
                        createEmbed('error', message.author)
                            .setTitle('Missing Permissions')
                            .setDescription(
                                'You need the `MANAGE_MESSAGES` permission to pin messages.'
                            )
                    ]
                });
            }

            try {
                await messageToPin.pin();
                await message.react(EMOJIS.pin);
            } catch {
                return await message.reply({
                    embeds: [
                        createEmbed('error', message.author)
                            .setTitle('Unable to pin')
                            .setDescription(
                                'Error while pinning the message. Please check my permissions before running the command.'
                            )
                    ]
                });
            }
        }
    }),
    new MessageCommand({
        name: 'unpin',
        description: 'Unpin a message',
        aliases: ['unpin'],
        help: '',
        execute: async (message) => {
            if (
                message.channel.type === ChannelType.DM ||
                message.channel.type === ChannelType.GroupDM
            )
                return;

            const messageToPin = await getRepliedMessage(message);

            if (!messageToPin) {
                return await message.reply({
                    embeds: [
                        createEmbed('error', message.author)
                            .setTitle('No message to pin')
                            .setDescription(
                                'You need to reply to a message to unpin it.'
                            )
                    ]
                });
            }

            const perms = message.channel.permissionsFor(message.member!);
            if (!perms?.has('ManageMessages')) {
                return await message.reply({
                    embeds: [
                        createEmbed('error', message.author)
                            .setTitle('Missing Permissions')
                            .setDescription(
                                'You need the `MANAGE_MESSAGES` permission to unpin messages.'
                            )
                    ]
                });
            }

            try {
                await messageToPin.unpin();
                await message.react(EMOJIS.pin);
            } catch {
                return await message.reply({
                    embeds: [
                        createEmbed('error', message.author)
                            .setTitle('Unable to unpin')
                            .setDescription(
                                'Error while pinning the message. Please check my permissions before running the command.'
                            )
                    ]
                });
            }
        }
    })
];
