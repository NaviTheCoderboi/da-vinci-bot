import {
    ActionRowBuilder,
    type Message,
    ButtonBuilder,
    type EmbedBuilder,
    type MessageActionRowComponentBuilder,
    ButtonStyle
} from 'discord.js';
import { EMOJIS } from '../constants';

export const paginationEmbed = async (
    message: Message,
    pages: EmbedBuilder[],
    timeout = 120000
) => {
    let page = 0;

    const leftCustomId = `left-${message.author.id}`;
    const rightCustomId = `right-${message.author.id}`;

    const leftButton = new ButtonBuilder()
        .setCustomId(leftCustomId)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(EMOJIS.left);
    const rightButton = new ButtonBuilder()
        .setCustomId(rightCustomId)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(EMOJIS.right);

    const row =
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            leftButton,
            rightButton
        );

    const curPage = await message.reply({
        embeds: [
            pages[page]!.setFooter({
                text: `Page ${page + 1} / ${pages.length}`
            })
        ],
        components: [row]
    });

    const collector = curPage.createMessageComponentCollector({
        filter: (i) => i.user.id === message.author.id,
        time: timeout
    });

    collector.on('collect', async (i) => {
        switch (i.customId) {
            case leftCustomId:
                page = page > 0 ? --page : pages.length - 1;
                break;
            case rightCustomId:
                page = page + 1 < pages.length ? ++page : 0;
                break;
            default:
                break;
        }
        await i.message.edit({
            embeds: [
                pages[page]!.setFooter({
                    text: `Page ${page + 1} / ${pages.length}`
                })
            ],
            components: [row]
        });
        collector.resetTimer();
    });

    collector.on('end', (_, reason) => {
        if (reason !== 'messageDelete') {
            const disabledRow =
                new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                    leftButton.setDisabled(true),
                    rightButton.setDisabled(true)
                );
            curPage.edit({
                embeds: [
                    pages[page]!.setFooter({
                        text: `Page ${page + 1} / ${pages.length}`
                    })
                ],
                components: [disabledRow]
            });
        }
    });

    return curPage;
};
