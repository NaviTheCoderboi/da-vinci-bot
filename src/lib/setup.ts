import path from 'node:path';
import fs from 'node:fs/promises';
import type ApplicationCommand from './base/ApplicationCommand';
import type MessageCommand from './base/MessageCommand';
import type Event from './base/Event';
import {
    Collection,
    REST,
    Routes,
    type RESTPostAPIApplicationCommandsJSONBody
} from 'discord.js';
import { $e } from './env';
import { logger } from './logger';

const commandsFolder = path.resolve(
    path.join(import.meta.dirname, '../commands')
);
const msgCommandsFolder = path.resolve(
    path.join(import.meta.dirname, '../msgCommands')
);
const eventsFolder = path.resolve(path.join(import.meta.dirname, '../events'));

const hasDefaultExport = (module: any) =>
    Object.keys(module).includes('default');

/**
 * Get all commands from the commands folder
 */
export const getCommands = async () => {
    const commands = new Collection<string, ApplicationCommand<any>>();

    const files = (await fs.readdir(commandsFolder)).filter((file) =>
        file.endsWith('.ts')
    );

    for (const file of files) {
        const command = await import(path.join(commandsFolder, file));

        if (hasDefaultExport(command)) {
            const cmd = command.default as ApplicationCommand;
            commands.set(cmd.data.name, cmd);
        } else {
            for (const cmd of command.commands) {
                commands.set(cmd.data.name, cmd);
            }
        }
    }

    return commands;
};

/**
 * Get all message commands from the msgCommands folder
 */
export const getMsgCommands = async () => {
    const commands = new Collection<string, MessageCommand>();

    const files = (await fs.readdir(msgCommandsFolder)).filter((file) =>
        file.endsWith('.ts')
    );

    for (const file of files) {
        const command = await import(path.join(msgCommandsFolder, file));

        if (hasDefaultExport(command)) {
            const cmd = command.default as MessageCommand;
            commands.set(cmd.name, cmd);
        } else {
            for (const cmd of command.commands) {
                commands.set(cmd.name, cmd);
            }
        }
    }

    return commands;
};

// /**
//  * Get all events from the events folder
//  */
// export const getEvents = async () => {
//     const events: Record<string, Event> = {};

//     const files = (await fs.readdir(eventsFolder)).filter((file) =>
//         file.endsWith('.ts')
//     );

//     for (const file of files) {
//         const event = await import(path.join(eventsFolder, file));

//         if (hasDefaultExport(event)) {
//             const evt = event.default as Event;
//             events[evt.name] = evt;
//         } else {
//             for (const key in event.events) {
//                 const evt = event[key] as Event;
//                 events[evt.name] = evt;
//             }
//         }
//     }

//     return events;
// };

export async function* getEvents() {
    const files = (await fs.readdir(eventsFolder)).filter((file) =>
        file.endsWith('.ts')
    );

    for (const file of files) {
        const event = await import(path.join(eventsFolder, file));

        if (hasDefaultExport(event)) {
            yield event.default as Event;
        } else {
            for (const ev of event.events) {
                yield ev as Event;
            }
        }
    }
}

/**
 * Deploy all global commands(application commands) to Discord
 */
export const deployGlobalCommands = async () => {
    const commands: RESTPostAPIApplicationCommandsJSONBody[] = Array.from(
        (await getCommands()).values().map((cmd) => cmd.data.toJSON())
    );

    const TOKEN = $e('TOKEN');
    const CLIENT_ID = $e('CLIENT_ID');

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    try {
        logger.info('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(CLIENT_ID), {
            body: commands
        });

        logger.success('Successfully reloaded application (/) commands.');
    } catch (error) {
        logger.error(error);
    }
};
