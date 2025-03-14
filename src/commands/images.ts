import { ApplicationCommandType, ContextMenuCommandBuilder } from 'discord.js';
import ApplicationCommand from '../lib/base/ApplicationCommand';
import { getImages } from '../lib/utilities/message';
import { createEmbed } from '../lib/embed';
import {
    blackAndWhiteImage,
    fetchImage,
    imageExtension,
    rotateImage
} from '../lib/utilities/images';
import { getDeleteButton, getRotationButtons } from '../lib/utilities/buttons';

const getRotateCmd = (degrees: number) =>
    new ApplicationCommand({
        data: new ContextMenuCommandBuilder()
            .setName(`Rotate ${degrees}deg`)
            .setType(ApplicationCommandType.Message),
        execute: async (interaction) => {
            await interaction.deferReply();

            try {
                const angle = degrees;
                const interMessageID = interaction.targetId;
                const repliedMessage =
                    await interaction.channel?.messages.fetch(interMessageID);

                if (!repliedMessage) {
                    return await interaction.editReply({
                        embeds: [
                            createEmbed('error', interaction.user)
                                .setTitle('No image found')
                                .setDescription(
                                    'Please reply to an image to rotate it.'
                                )
                        ]
                    });
                }

                const images = getImages(repliedMessage);

                if (images.length === 0) {
                    return await interaction.editReply({
                        embeds: [
                            createEmbed('error', interaction.user)
                                .setTitle('No image found')
                                .setDescription(
                                    'Please reply to an image to rotate it.'
                                )
                        ]
                    });
                }

                const fetchedImage = await fetchImage(images[0]!);

                if (!fetchedImage) {
                    return await interaction.editReply({
                        embeds: [
                            createEmbed('error', interaction.user)
                                .setTitle('Error')
                                .setDescription('Failed to fetch the image.')
                        ]
                    });
                }

                const rotated = await rotateImage(fetchedImage, angle);
                const rotationButtons = getRotationButtons(interaction.user);

                await interaction.editReply({
                    files: [
                        {
                            attachment: rotated,
                            name: `rotated.${imageExtension(images[0]!)}`
                        }
                    ],
                    components: [rotationButtons]
                });
            } catch (e) {
                await interaction.editReply({
                    embeds: [
                        createEmbed('error', interaction.user)
                            .setTitle('Error')
                            .setDescription('Failed to rotate the image.')
                    ]
                });
                throw e;
            }
        }
    });

export const commands = [
    getRotateCmd(90),
    getRotateCmd(-90),
    getRotateCmd(180),
    getRotateCmd(270),
    new ApplicationCommand({
        data: new ContextMenuCommandBuilder()
            .setName('Black & White')
            .setType(ApplicationCommandType.Message),
        execute: async (interaction) => {
            await interaction.deferReply();

            try {
                const interMessageID = interaction.targetId;
                const repliedMessage =
                    await interaction.channel?.messages.fetch(interMessageID);

                if (!repliedMessage) {
                    return await interaction.editReply({
                        embeds: [
                            createEmbed('error', interaction.user)
                                .setTitle('No image found')
                                .setDescription(
                                    'Please reply to an image to apply filter to it.'
                                )
                        ]
                    });
                }

                const images = getImages(repliedMessage);

                if (images.length === 0) {
                    return await interaction.editReply({
                        embeds: [
                            createEmbed('error', interaction.user)
                                .setTitle('No image found')
                                .setDescription(
                                    'Please reply to an image to apply filter to it.'
                                )
                        ]
                    });
                }

                const fetchedImage = await fetchImage(images[0]!);

                if (!fetchedImage) {
                    return await interaction.editReply({
                        embeds: [
                            createEmbed('error', interaction.user)
                                .setTitle('Error')
                                .setDescription('Failed to fetch the image.')
                        ]
                    });
                }

                const bwImage = await blackAndWhiteImage(fetchedImage);
                const deleteButton = getDeleteButton(interaction.user);

                await interaction.editReply({
                    files: [
                        {
                            attachment: bwImage,
                            name: `blackwhite.${imageExtension(images[0]!)}`
                        }
                    ],
                    components: [deleteButton]
                });
            } catch (e) {
                await interaction.editReply({
                    embeds: [
                        createEmbed('error', interaction.user)
                            .setTitle('Error')
                            .setDescription(
                                'Failed to apply filter to the image.'
                            )
                    ]
                });
                throw e;
            }
        }
    })
];
