import type MessageCommand from '../lib/base/MessageCommand';
import Event from '../lib/base/Event';
import { Events, type Message } from 'discord.js';
import { PREFIX } from '../lib/constants';
import { logger } from '../lib/logger';

export default new Event({
    name: Events.MessageCreate,
    async execute(message: Message): Promise<void> {
        if (!message.content.startsWith(PREFIX) || message.author.bot) return;

        if (!client.application?.owner) await client.application?.fetch();

        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const commandName = (<string>args.shift()).toLowerCase();

        const command =
            (client.msgCommands.get(commandName) as MessageCommand) ||
            (client.msgCommands.find((cmd: MessageCommand): boolean =>
                cmd.aliases?.includes(commandName)
            ) as MessageCommand);

        if (!command) return;

        try {
            await command.execute(message, args);
        } catch (error) {
            logger.error(`MessageCommand: ${error}`);
        }
    }
});
