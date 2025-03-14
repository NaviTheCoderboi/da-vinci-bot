import {
    type BaseInteraction,
    type ButtonInteraction,
    Events
} from 'discord.js';
import Event from '../lib/base/Event';
import { logger } from '../lib/logger';
import { createEmbed } from '../lib/embed';
import { interRotate } from '../msgCommands/images';

const buttonIdRegex = /^(.*?)(?:-([^-]+))?$/;

const notForUserReply = async (interaction: ButtonInteraction) =>
    await interaction.followUp({
        embeds: [
            createEmbed('error', interaction.user)
                .setTitle('Error')
                .setDescription('You cannot use this button!')
        ],
        ephemeral: true
    });

const userOnlyFilter = async (inter: ButtonInteraction) => {
    const match = buttonIdRegex.exec(inter.customId);

    if (!match || !match[2]) {
        await notForUserReply(inter);
        return false;
    }

    const userId = match[2];
    const isSameUser = inter.user.id === userId;

    if (!isSameUser) await notForUserReply(inter);

    return isSameUser;
};

interface Handler {
    idRegex: RegExp;
    execute: (interaction: ButtonInteraction) => Promise<void>;
    filter?: (interaction: ButtonInteraction) => boolean | Promise<boolean>;
}

const handlers: Handler[] = [
    {
        idRegex: /^rotate_left-(\d+)$/,
        execute: async (interaction) => {
            await interRotate(interaction, -90);
        },
        filter: userOnlyFilter
    },
    {
        idRegex: /^rotate_right-(\d+)$/,
        execute: async (interaction) => {
            await interRotate(interaction, 90);
        },
        filter: userOnlyFilter
    },
    {
        idRegex: /^delete-(\d+)$/,
        execute: async (interaction) => {
            if (interaction.message.deletable)
                await interaction.message.delete();
        },
        filter: userOnlyFilter
    }
];

export default new Event({
    name: Events.InteractionCreate,
    async execute(interaction: BaseInteraction): Promise<void> {
        if (!interaction.isButton()) return;

        await interaction.deferUpdate();

        try {
            const id = interaction.customId;
            const handler = handlers.find((h) => h.idRegex.test(id));

            if (!handler) return;

            const filter = handler.filter ?? (() => true);
            if (!(await filter(interaction))) return;

            await handler.execute(interaction);
        } catch (error) {
            logger.error(`Button: ${error}`);
            await interaction.followUp({
                embeds: [
                    createEmbed('error', interaction.user)
                        .setTitle('Error')
                        .setDescription(
                            'There was an error while executing this button!'
                        )
                ],
                ephemeral: true
            });
        }
    }
});
