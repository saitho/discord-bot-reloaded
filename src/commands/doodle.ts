import {CommandInteraction} from "discord.js";
import AbstractCommand from "../lib/command/command";
import {command, description, name, option} from "../lib/command/decorators";

@command('doodle', 'Watch Doodle poll votings and send messages if certain things happen')
export default class DoodleCommand extends AbstractCommand {
    /**
     * Dynamically called by `AbstractCommand::processInteraction`
     * @param interaction
     * @protected
     */
    @name('add')
    @description('Setup a new Doodle watcher')
    @option('link', 'Code or link to Doodle', 3, true)
    @option('condition', 'Condition string (see documentation)', 3, false)
    @option('message', 'Message to post (see documentation)', 3, false)
    @option('time', 'time at which trigger is checked (crontab format)', 3, false)
    @option('channel', 'Channel to post the message to (per default uses channel where setup was posted)', 7, false)
    @option('single-execution', 'Whether to remove the watcher after execution (default: false)', 5, false)
    protected async setup(interaction: CommandInteraction) {
        const link = interaction.options.getString('link')!
        // todo: extract code from link if it is a Doodle URL

        const channel = interaction.options.getChannel('channel', false) ?? interaction.channel;
        const singleExecution = interaction.options.getBoolean('single-execution', false) ?? false;

        // todo: wizard for missing condition, message and time
        // <condition> <message> <time> [channel] [removeAfterExecution]

        // todo: check `time` crontab format
        /**
         * await Scheduler.getInstance().scheduleTask({
                    id: schedulerTaskId,
                    enabled: true,
                    executionTime: `${time}`,
                    executionTimeMode: "cron",
                    workerFile: `doodle-update.js`,
                    workerFile: `doodle-update-single.js`,
                    guildId: interaction.guildId,
                    targetChannelId: channelId,
                    labels: ['doodle'],
                    data: JSON.stringify({
                        condition: 'condition',
                        message: 'message'
                    })
                });
         */
    }
}
