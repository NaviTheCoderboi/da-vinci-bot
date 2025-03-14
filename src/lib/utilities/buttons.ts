import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    type MessageActionRowComponentBuilder,
    type User
} from 'discord.js';
import { EMOJIS } from '../constants';

export const getDeleteButton = (user: User) => {
    const deleteBtn = new ButtonBuilder()
        .setCustomId(`delete-${user.id}`)
        .setStyle(ButtonStyle.Danger)
        .setEmoji(EMOJIS.bin);

    return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        deleteBtn
    );
};

export const getRotationButtons = (user: User) => {
    const leftBtn = new ButtonBuilder()
        .setCustomId(`rotate_left-${user.id}`)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(EMOJIS.leftHook);
    const rightBtn = new ButtonBuilder()
        .setCustomId(`rotate_right-${user.id}`)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(EMOJIS.rightHook);
    const deleteBtn = new ButtonBuilder()
        .setCustomId(`delete-${user.id}`)
        .setStyle(ButtonStyle.Danger)
        .setEmoji(EMOJIS.bin);

    return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        leftBtn,
        rightBtn,
        deleteBtn
    );
};
