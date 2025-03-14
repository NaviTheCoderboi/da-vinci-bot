import MessageCommand from '../lib/base/MessageCommand';
import { createEmbed } from '../lib/embed';

export default new MessageCommand({
    name: 'ping',
    description: "Get the bot's ping",
    aliases: ['ping'],
    execute: async (message) => {
        const ping = Date.now() - message.createdTimestamp;

        await message.reply({
            embeds: [
                createEmbed('success', message.author)
                    .setTitle('Pong!')
                    .setDescription(`Bot's ping is ${ping}ms 🏓`)
            ]
        });
    },
    help: ''
});
