import type { Message, ButtonInteraction } from 'discord.js';
import { getImages, getRepliedMessage } from '../lib/utilities/message';
import { createEmbed } from '../lib/embed';
import {
    blackAndWhiteImage,
    fetchImage,
    imageExtension,
    rotateImage
} from '../lib/utilities/images';
import MessageCommand from '../lib/base/MessageCommand';
import { getDeleteButton, getRotationButtons } from '../lib/utilities/buttons';

export const commands = [
    new MessageCommand({
        name: 'rotate',
        description: 'rotate an image',
        aliases: ['rotate', 'rt'],
        help: '',
        execute: async (message: Message, args: string[]) => {
            const rawAngle = args.at(0);
            if (!rawAngle) {
                return await message.reply({
                    embeds: [
                        createEmbed('error', message.author)
                            .setTitle('No angle provided')
                            .setDescription(
                                'Please provide an angle to rotate the image by.'
                            )
                    ]
                });
            }

            try {
                const angle = Number.parseInt(rawAngle);
                const repliedMessage = await getRepliedMessage(message);

                if (!repliedMessage) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('No image found')
                                .setDescription(
                                    'Please reply to an image to rotate it.'
                                )
                        ]
                    });
                }

                const images = getImages(repliedMessage);

                if (images.length === 0) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('No image found')
                                .setDescription(
                                    'Please reply to an image to rotate it.'
                                )
                        ]
                    });
                }

                const fetchedImage = await fetchImage(images[0]!);

                if (!fetchedImage) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('Error')
                                .setDescription('Failed to fetch the image.')
                        ]
                    });
                }

                const rotated = await rotateImage(fetchedImage, angle);
                const rotationButtons = getRotationButtons(message.author);

                await message.reply({
                    files: [
                        {
                            attachment: rotated,
                            name: `rotated.${imageExtension(images[0]!)}`
                        }
                    ],
                    components: [rotationButtons]
                });
            } catch (e) {
                await message.reply({
                    embeds: [
                        createEmbed('error', message.author)
                            .setTitle('Error')
                            .setDescription('Failed to rotate the image.')
                    ]
                });
                throw e;
            }
        }
    }),
    new MessageCommand({
        name: 'blackwhite',
        description: 'Convert an image to black and white',
        aliases: ['blackwhite', 'bw'],
        help: '',
        execute: async (message) => {
            try {
                const repliedMessage = await getRepliedMessage(message);

                if (!repliedMessage) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('No image found')
                                .setDescription(
                                    'Please reply to an image to apply filter to it.'
                                )
                        ]
                    });
                }

                const images = getImages(repliedMessage);

                if (images.length === 0) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('No image found')
                                .setDescription(
                                    'Please reply to an image to apply filter to it.'
                                )
                        ]
                    });
                }

                const fetchedImage = await fetchImage(images[0]!);

                if (!fetchedImage) {
                    return await message.reply({
                        embeds: [
                            createEmbed('error', message.author)
                                .setTitle('Error')
                                .setDescription('Failed to fetch the image.')
                        ]
                    });
                }

                const bwImage = await blackAndWhiteImage(fetchedImage);
                const deleteButton = getDeleteButton(message.author);

                await message.reply({
                    files: [
                        {
                            attachment: bwImage,
                            name: `blackwhite.${imageExtension(images[0]!)}`
                        }
                    ],
                    components: [deleteButton]
                });
            } catch (e) {
                await message.reply({
                    embeds: [
                        createEmbed('error', message.author)
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

export const interRotate = async (
    interaction: ButtonInteraction,
    angle: number
) => {
    try {
        const repliedMessage = interaction.message;

        const images = getImages(repliedMessage);

        if (images.length === 0) {
            return await interaction.reply({
                embeds: [
                    createEmbed('error', interaction.user)
                        .setTitle('No image found')
                        .setDescription(
                            'Please reply to an image to rotate it.'
                        )
                ],
                flags: ['Ephemeral']
            });
        }

        const fetchedImage = await fetchImage(images[0]!);

        if (!fetchedImage) {
            return await interaction.reply({
                embeds: [
                    createEmbed('error', interaction.user)
                        .setTitle('Error')
                        .setDescription('Failed to fetch the image.')
                ]
            });
        }

        const rotated = await rotateImage(fetchedImage, angle);

        await repliedMessage.edit({
            files: [
                {
                    attachment: rotated,
                    name: 'rotated.png'
                }
            ],
            components: repliedMessage.components
        });
    } catch (e) {
        await interaction.reply({
            embeds: [
                createEmbed('error', interaction.user)
                    .setTitle('Error')
                    .setDescription('Failed to rotate the image.')
            ],
            flags: ['Ephemeral']
        });
        throw e;
    }
};
