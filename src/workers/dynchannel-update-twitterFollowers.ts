import {parentPort, workerData} from "worker_threads";
import {Client} from "discord.js";
import {ACTION_REMOVE_TASK} from "../lib/tasks/scheduler";
import axios from "axios";

(async () => {
    const { token, twitterToken } = require('../../config.json')
    const {workerData} = require("worker_threads");

    const bot = new Client({intents: []});
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

    axios({
        method: 'get',
        url: 'https://api.twitter.com/2/users/by/username/' + jobData.additionalData.user + '?user.fields=public_metrics',
        headers: { 'Authorization': `bearer ${twitterToken}` }
    })
        .then(async (response) => {
            const newName = jobData.label.replace('%d', response.data.data.public_metrics.followers_count);
            if (channel.name !== newName) {
                await channel!.setName(newName);
            }
        })
        .catch(function (error) {
            console.log(error);
        });
})();

