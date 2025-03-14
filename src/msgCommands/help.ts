import type { EmbedBuilder } from 'discord.js';
import MessageCommand from '../lib/base/MessageCommand';
import { PREFIX } from '../lib/constants';
import { createEmbed } from '../lib/embed';
import { paginationEmbed } from '../lib/utilities/pagination';

export default new MessageCommand({
    name: 'help',
    description: 'Shows a list of all commands',
    aliases: ['help'],
    help: 'help <command?>',
    execute: async (message, args) => {
        const cmd = args[0];

        if (cmd) {
            const command =
                client.msgCommands.get(cmd) ??
                client.msgCommands.find((c) => c.aliases.includes(cmd));
            if (!command) {
                return await message.reply({
                    embeds: [
                        createEmbed('error', message.author)
                            .setTitle('Command not found')
                            .setDescription(
                                `The command \`${cmd}\` does not exist`
                            )
                    ]
                });
            }

            const embed = createEmbed('info', message.author)
                .setTitle(command.name)
                .setDescription(command.description)
                .addFields(
                    {
                        name: 'Aliases',
                        value: command.aliases.join(', '),
                        inline: true
                    },
                    {
                        name: 'Usage',
                        value: `\`${PREFIX}${command.name} ${command.help}\``,
                        inline: true
                    }
                );

            return await message.reply({
                embeds: [embed]
            });
        }

        const pageSize = 5;

        const embeds: EmbedBuilder[] = [];
        const fields = Array.from(client.msgCommands.values()).map((cmd) => ({
            name: cmd.name,
            value: `${cmd.description}\nAliases: ${cmd.aliases.join(', ')} | Usage: \`${PREFIX}${cmd.name} ${cmd.help}\``
        }));

        for (let i = 0; i < fields.length; i += pageSize) {
            const embed = createEmbed('info', message.author)
                .setTitle('Help')
                .setDescription(
                    `Here is a list of all commands\nUse ${PREFIX}help <command> for more info on a specific command`
                )
                .addFields(fields.slice(i, i + pageSize));

            embeds.push(embed);
        }

        await paginationEmbed(message, embeds);
    }
});
