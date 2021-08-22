import {ButtonInteractionHandler} from "./button_interaction_handler";
import CommandLoader from "./loader";
import {Client} from "discord.js";
import * as util from "util";

export interface CommandInitConfig {
    commandPath: string;
    excludeCommands?: string[];
    includeCommands?: string[];
}

export default async function init(client: Client, config: CommandInitConfig) {
    const buttonInteractionHandler = new ButtonInteractionHandler()
    const commandLoader = new CommandLoader(client, buttonInteractionHandler)
    commandLoader.loadCommands(
        config.commandPath,
        config.excludeCommands ?? [],
        config.includeCommands ?? []
    )

    if (process.env.PUBLISH_COMMANDS) {
        // Register commands
        await commandLoader.publishCommands();
    }

    if (process.env.PREVIEW_COMMANDS) {
        console.log(util.inspect(commandLoader.buildDiscordCommandJson(), false, null, true));
        return;
    }

    // Slash command interactions
    client.on('interactionCreate', async (interaction) => {
        if (interaction.isButton()) {
            await buttonInteractionHandler.handleButtonInteraction(interaction)
            return
        }
        if (interaction.isCommand()) {
            await commandLoader.resolveCommandInteraction(interaction)
            return
        }
    });
}
