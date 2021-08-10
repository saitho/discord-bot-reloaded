// Do not use "import" syntax so this file is not needed during build!
import { ActivityType } from 'discord-api-types/payloads/v9';

const { token } = require('../config.json')

// setup logger
import {configure, getLogger} from "log4js";
import {Client, Intents} from "discord.js";
import initCommands from "./lib/command/init";
import path from "path";
import {Scheduler} from "./lib/tasks/scheduler";
import db from "./lib/database/database";
import {createTaskFromDatabaseRow} from "./lib/tasks/task";

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

const bot = new Client({
    intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS],
    presence: {
        status: "online",
        activities: [
            {
                name: "Overwatch Soundtracks",
                type: ActivityType.Listening
            }
        ]
    }
});

// Start scheduler
Scheduler.getInstance()
    .setWorkerDirectory(path.resolve(__dirname, 'workers'))
    .start();

bot.once('ready', async (client) => {
    await initCommands(client, path.join(__dirname, 'commands'))

    // Load tasks from database
    const rows = db.prepare('SELECT * FROM scheduler_tasks WHERE enabled = 1').all();
    for (const row of rows) {
        await Scheduler.getInstance().schedule(createTaskFromDatabaseRow(row), false);
    }
    getLogger().info(`Loaded ${rows.length} tasks from database.`);

    getLogger().info(`${client.user.username} is online!`);
    console.log(`${client.user.username} is online!`);
})

bot.login(token).catch((err) => getLogger().error(err));
