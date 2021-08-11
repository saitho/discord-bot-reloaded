import {parentPort, workerData} from "worker_threads";
import {Client, Intents} from "discord.js";
import {ACTION_REMOVE_TASK} from "../lib/tasks/scheduler";

(async () => {
    const { token } = require('../../config.json')
    const {workerData} = require("worker_threads");

    const bot = new Client({intents: [Intents.FLAGS.GUILD_MEMBERS]});
    const status = await bot.login(token);
    if (!status) {
        return;
    }

    const jobWorkerData = workerData.job.worker.workerData;

    if (!jobWorkerData.guild_id || !jobWorkerData.target_channel_id) {
        return;
    }

    const jobData = JSON.parse(jobWorkerData.data);
    const guild = await bot.guilds.fetch(jobWorkerData.guild_id)
    const channel = (await guild.channels.fetch(jobWorkerData.target_channel_id));
    if (!channel) {
        // Channel not found: remove task
        parentPort!.postMessage(ACTION_REMOVE_TASK);
        return;
    }

    const newName = jobData.label.replace('%d', (await guild.members.fetch()).size);
    if (channel.name !== newName) {
        await channel!.setName(newName);
    }
})();
