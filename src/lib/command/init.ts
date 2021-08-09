import {ButtonInteractionHandler} from "./button_interaction_handler";
import CommandLoader from "./loader";
import {Client} from "discord.js";

export default async function init(client: Client, commandPath: string) {
    const buttonInteractionHandler = new ButtonInteractionHandler()
    const commandLoader = new CommandLoader(client, buttonInteractionHandler)
    commandLoader.loadCommands(commandPath)

    if (process.env.PUBLISH_COMMANDS) {
        // Register commands
        await commandLoader.publishCommands();
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
