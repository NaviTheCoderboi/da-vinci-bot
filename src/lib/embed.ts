import { EmbedBuilder, type User } from 'discord.js';

const colors = {
    error: 0xff2056,
    success: 0x00bc7d,
    warning: 0xffb900,
    info: 0x7c86ff,
    neutral: 0x808080
};

export const createEmbed = (type: keyof typeof colors, user: User) => {
    const embed = new EmbedBuilder()
        .setColor(colors[type])
        .setTimestamp()
        .setFooter({
            text: user.tag ?? 'unknown',
            iconURL: (user.avatarURL() ?? undefined) as string
        });

    return embed;
};
