import { type BaseInteraction, Events } from 'discord.js';
import Event from '../lib/base/Event';
import type ApplicationCommand from '../lib/base/ApplicationCommand';
import { logger } from '../lib/logger';
import { createEmbed } from '../lib/embed';

export default new Event({
    name: Events.InteractionCreate,
    async execute(interaction: BaseInteraction): Promise<void> {
        if (
            interaction.isChatInputCommand() ||
            interaction.isContextMenuCommand()
        ) {
            if (!client.commands.has(interaction.commandName)) return;
            try {
                const command = (await client.commands.get(
                    interaction.commandName
                )) as ApplicationCommand<any>;

                if (!command.execute) {
                    logger.error(
                        `ApplicationCommand: Failed to find execution handler for ${command.data.name}`
                    );
                    await interaction.reply({
                        embeds: [
                            createEmbed('error', interaction.user)
                                .setTitle('Error')
                                .setDescription(
                                    'There was an error while executing this command!'
                                )
                        ],
                        ephemeral: true
                    });
                    return;
                }

                await command.execute(interaction);
            } catch (error) {
                logger.error(`ApplicationCommand: ${error}`);
                await interaction.reply({
                    embeds: [
                        createEmbed('error', interaction.user)
                            .setTitle('Error')
                            .setDescription(
                                'There was an error while executing this command!'
                            )
                    ],
                    ephemeral: true
                });
            }
        } else if (interaction.isAutocomplete()) {
            if (!client.commands.has(interaction.commandName)) return;

            try {
                const command: ApplicationCommand = (await client.commands.get(
                    interaction.commandName
                )) as ApplicationCommand;

                if (!command.autocomplete) {
                    logger.error(
                        `ApplicationCommand: Failed to find autocomplete handler for ${command.data.name}`
                    );
                    await interaction.respond([
                        {
                            name: 'Failed to autocomplete',
                            value: 'error'
                        }
                    ]);
                    return;
                }

                await command.autocomplete(interaction);
            } catch (error) {
                logger.error(`ApplicationCommand: ${error}`);
            }
        }
    }
});
