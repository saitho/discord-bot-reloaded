import {CommandInteraction, DiscordAPIError, MessageActionRow} from "discord.js";
import AbstractCommand from "../lib/command/command";
import {command, description, group, name, option} from "../lib/command/decorators";
import {Scheduler} from "../lib/tasks/scheduler";

@command('dynchannel', 'Show dynamic data (e.g. number of members) in a channel name')
export default class DynChannelCommand extends AbstractCommand {
    /**
     * Dynamically called by `AbstractCommand::processInteraction`
     * @param interaction
     * @protected
     */
    @group('setup')
    @name('twitter-followers')
    @description('Display number of Twitter followers in header')
    @option('twittername', 'Name of the Twitter account', 3, true)
    @option('channel', 'Channel ID (should be a voice channel)', 3, true)
    @option('label', 'Override label displayed in channel name. %d will print the number of followers', 3)
    protected async setup_twitterFollowers(interaction: CommandInteraction) {
        const twitterName = interaction.options.getString('twittername')!
            .replace(new RegExp('^[@]+'), ''); // remove leading @ from name if given

        await this.setupDynamicChannelHeader(
            interaction,
            'twitterFollowers',
            'Twitter Followers: %d',
            `Do you really want to show the **Twitter followers** of Twitter user **${twitterName}** in the title of channel %s?`,
            `Preview (assuming _${twitterName}_ has %s followers):`,
            123,
            { user: twitterName }
        )
    }

    /**
     * Dynamically called by `AbstractCommand::processInteraction`
     * @param interaction
     * @protected
     */
    @group('setup')
    @name('guild-members')
    @description('Display number of guild members in header')
    @option('channel', 'Channel ID (should be a voice channel)', 3, true)
    @option('label', 'Override label displayed in channel name. %d will print the number of followers', 3)
    protected async setup_guildMembers(interaction: CommandInteraction) {
        if (!interaction.inGuild()) {
            await interaction.reply({ embeds: [{
                    color: 'RED',
                    title: 'Oops, an error occurred.',
                    description: 'This command can not be used outside of Discord servers.'
                }], ephemeral: true });
            return;
        }
        const memberCount = (await interaction.guild!.members.fetch()).size
        await this.setupDynamicChannelHeader(
            interaction,
            'guildMembers',
            'Members: %d',
            `Do you really want to show the number of members on this Discord server in the title of channel %s?`,
            `Preview (assuming server has %s members):`,
            memberCount
        )
    }

    /**
     * Dynamically called by `AbstractCommand::processInteraction`
     * @param interaction
     * @protected
     */
    @name('teardown')
    @description('Remove dynamic settings for a channel')
    @option('channel', 'Channel ID', 3, true)
    protected async teardown(interaction: CommandInteraction) {
        if (!interaction.inGuild()) {
            await interaction.reply({ embeds: [{
                    color: 'RED',
                    title: 'Oops, an error occurred.',
                    description: 'This command can not be used outside of Discord servers.'
                }], ephemeral: true });
            return;
        }
        const channelId = interaction.options.getString('channel')!

        // Validate channel exists on server
        try {
            await interaction.client.channels.fetch(channelId!)
        } catch (e) {
            let message = `There is no channel on this server with id ${channelId}.`;
            if (e.code === 50001) {
                message = `I was unable to access the channel list. Please contact the server owner.`
            }
            await interaction.reply({ embeds: [{
                    color: 'RED',
                    title: 'Oops, an error occurred.',
                    description: message
                }], ephemeral: true });
            return;
        }

        const task = Scheduler.getInstance().findPersistedTaskByChannel(interaction.guildId, channelId, ['dynchannel']);
        if (!task) {
            await interaction.reply({ embeds: [{
                    color: 'RED',
                    title: 'Oops, an error occurred.',
                    description: 'The channel does not have a dynchannel setup that could be removed.'
                }], ephemeral: true });
            return;
        }

        const acceptButton = this.createNewButton(
            'accept',
            'Accept',
            'PRIMARY',
            async (interaction) => {
                await Scheduler.getInstance().unscheduleTask(task.id);
                await interaction.reply({ embeds: [{
                        title: 'Teardown completed',
                        description: `The title of voice channel <#${channelId}> will not be updated anymore.`
                    }], ephemeral: true });
            },
            'teardown'
        );
        const abortButton = this.createNewButton(
            'abort',
            'Abort',
            'SECONDARY',
            async (interaction) => {
                await interaction.reply({ content: 'Teardown aborted.', ephemeral: true });
            },
            'teardown'
        );

        const row = new MessageActionRow().addComponents(acceptButton, abortButton);

        await interaction.reply({ embeds: [{
                title: 'Please confirm your setting',
                description: `Are you sure you want to remove dynchannel settings on channel <#${channelId}>?`
            }], components: [row], ephemeral: true });
        this.createTimeoutForGroup(30, 'teardown')
    }

    protected async setupDynamicChannelHeader(
        interaction: CommandInteraction,
        type: string,
        defaultLabel: string,
        confirmText = 'Do you really want to update the title of channel %s automatically?',
        previewText = 'Preview:',
        sampleValue = 123,
        data: any = {},
        updateIntervalMinutes = 5
    ) {
        if (!interaction.inGuild()) {
            await interaction.reply({ embeds: [{
                    color: 'RED',
                    title: 'Oops, an error occurred.',
                    description: 'This command can not be used outside of Discord servers.'
                }], ephemeral: true });
            return;
        }

        const buttonGroupName = `dynchannel-${type}`;
        const channelId = interaction.options.getString('channel')
        const label = interaction.options.getString('label') ?? defaultLabel;

        // Validate channel exists on server
        try {
            await interaction.client.channels.fetch(channelId!)
        } catch (e) {
            let message = `There is no channel on this server with id ${channelId}.`;
            if (e.code === 50001) {
                message = `I was unable to access the channel list. Please contact the server owner.`
            }
            await interaction.reply({ embeds: [{
                    color: 'RED',
                    title: 'Oops, an error occurred.',
                    description: message
                }], ephemeral: true });
            return;
        }

        const schedulerTaskId = `dynchannel-${interaction.guildId}-${channelId}`;
        const persistedTask = Scheduler.getInstance().getPersistedTask(schedulerTaskId);
        if (persistedTask) {
            await interaction.reply({ embeds: [{
                    color: 'RED',
                    title: 'Oops, an error occurred.',
                    description: 'This channel already has a dynchannel configuration.'
                }], ephemeral: true });
            return;
        }

        const acceptButton = this.createNewButton(
            'accept',
            'Accept',
            'PRIMARY',
            async (interaction) => {
                await Scheduler.getInstance().scheduleTask({
                    id: schedulerTaskId,
                    enabled: true,
                    executionTime: `every ${updateIntervalMinutes} minutes`,
                    executionTimeMode: "interval",
                    workerFile: `dynchannel-update-${type}.js`,
                    guildId: interaction.guildId,
                    targetChannelId: channelId,
                    executeImmediately: true,
                    labels: ['dynchannel'],
                    data: JSON.stringify({
                        label: label,
                        additionalData: data,
                    })
                });
                await interaction.reply({ embeds: [{
                    title: 'Setup completed',
                    description: `The title of voice channel <#${channelId}> will now be updated regularly.`
                }], ephemeral: true });
            },
            buttonGroupName
        );
        const abortButton = this.createNewButton(
            'abort',
            'Abort',
            'SECONDARY',
            async (interaction) => {
                await interaction.reply({ content: 'Setup aborted.', ephemeral: true });
            },
            buttonGroupName
        );

        const row = new MessageActionRow().addComponents(acceptButton, abortButton);

        await interaction.reply({ embeds: [{
                title: 'Please confirm your setting',
                description: `${confirmText.replace('%s', `<#${channelId}>`)}
            
            ${previewText.replace('%s', sampleValue.toString())}
            \`\`\`${label.replace('%d', sampleValue.toString())}\`\`\`
            This will override and replace the current channel name.
            
            (Note: Please make a selection within 30 seconds.)`
            }], components: [row], ephemeral: true });
        this.createTimeoutForGroup(30, buttonGroupName)
    }
}
