/* eslint-disable no-var */
import type { Client, Collection } from 'discord.js';
import type ApplicationCommand from './lib/base/ApplicationCommand';
import type MessageCommand from './lib/base/MessageCommand';

interface DiscordClient extends Client {
    commands: Collection<string, ApplicationCommand<any>>;
    msgCommands: Collection<string, MessageCommand>;
}

declare global {
    var client: DiscordClient;
}
