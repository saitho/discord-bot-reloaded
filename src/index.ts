// Do not use "import" syntax so this file is not needed during build!
import { ActivityType } from 'discord-api-types/payloads/v9';

const { token } = require('../config.json')

// setup logger
import {configure, getLogger} from "log4js";
import {Client, Intents} from "discord.js";
import {ButtonInteractionHandler} from "./lib/command/button_interaction_handler";
import path from "path";
import CommandLoader from "./lib/command/loader";

configure({
    appenders: {
        app: {
            type: "file",
            filename: "log/app.log",
            maxLogSize: 10485760,
            numBackups: 3
        },
        errorFile: {
            type: "file",
            filename: "log/errors.log"
        },
        errors: {
            type: "logLevelFilter",
            level: "ERROR",
            appender: "errorFile"
        }},
    categories: { default: { appenders: ["app", "errors"], level: "INFO" } }
})

const bot = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] });


bot.once('ready', async (client) => {

    const buttonInteractionHandler = new ButtonInteractionHandler();
    const commandLoader = new CommandLoader(client, buttonInteractionHandler);
    commandLoader.loadCommands(path.join(__dirname, 'commands'))

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

    await client.user.setPresence({
        activities: [
            {
                name: "Some like it bot",
                type: ActivityType.Watching
            }
        ]
    })
    await client.user.setStatus("idle")
    getLogger().info(`${client.user.username} is online!`);
    console.log(`${client.user.username} is online!`);
})

bot.login(token).catch((err) => getLogger().error(err));
