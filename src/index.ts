import { Client, Collection, Partials } from 'discord.js';
import type ApplicationCommand from './lib/base/ApplicationCommand';
import type MessageCommand from './lib/base/MessageCommand';
import {
    deployGlobalCommands,
    getCommands,
    getEvents,
    getMsgCommands
} from './lib/setup';
import { $e } from './lib/env';
import { logger } from './lib/logger';

await deployGlobalCommands();

global.client = Object.assign(
    new Client({
        intents: [
            'Guilds',
            'GuildMessages',
            'MessageContent',
            'GuildMessageReactions',
            'DirectMessageReactions'
        ],
        partials: [Partials.Message, Partials.Reaction]
    }),
    {
        commands: new Collection<string, ApplicationCommand<any>>(),
        msgCommands: new Collection<string, MessageCommand>()
    }
);

const commands = await getCommands();
const msgCommands = await getMsgCommands();

client.commands = commands;
client.msgCommands = msgCommands;

for await (const event of getEvents()) {
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.on('ready', () => {
    logger.info(`Logged in as ${client.user?.tag ?? 'Unknown'}`);
});

const TOKEN = $e('TOKEN');
await client.login(TOKEN);
