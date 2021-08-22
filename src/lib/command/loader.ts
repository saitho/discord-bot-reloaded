import * as fs from "fs";
import path from "path";
import AbstractCommand, {ISubCommand} from "./command";
import {ApplicationCommandData, Client, CommandInteraction} from "discord.js";
import {ButtonInteractionHandler} from "./button_interaction_handler";
import {getLogger} from "log4js";
import {InternalCommandOption} from "./types";

export default class CommandLoader {
    protected client: Client;
    protected buttonHandler: ButtonInteractionHandler;

    protected commands = new Map<string, AbstractCommand>();

    constructor(client: Client, buttonHandler: ButtonInteractionHandler) {
        this.client = client;
        this.buttonHandler = buttonHandler;
    }

    public async resolveCommandInteraction(interaction: CommandInteraction) {
        if (!this.commands.has(interaction.commandName)) {
            return;
        }
        const cmd = this.commands.get(interaction.commandName)!;
        await cmd.processInteraction(interaction);
    }

    public loadCommands(directory: string, excludeCommands: string[] = [], includeCommands: string[] = []) {
        if (excludeCommands.length > 0 && includeCommands.length > 0) {
            throw new Error("Only one of excludeCommands and includeCommands setting may be set.");
        }
        const client = this.client;
        const buttonHandler = this.buttonHandler;
        fs.readdirSync(directory)
            .forEach((file) => {
                const include = require(path.join(directory, file))
                const instance = new (include.default)(client, buttonHandler)
                if (!(instance instanceof AbstractCommand)) {
                    return;
                }
                if (excludeCommands.length > 0 && excludeCommands.includes(instance.getCommandName())) {
                    // file is in excludeCommands list
                    return;
                } else if (includeCommands.length > 0 && !includeCommands.includes(instance.getCommandName())) {
                    // file is not in includeCommands list
                    return;
                }
                this.commands.set(instance.getCommandName(), instance);
            });
    }

    protected createCommandJson(subcommand: ISubCommand) {
        let options: any[] = [];
        for (const opt of subcommand.options) {
            options.push({
                name: opt.name,
                description: opt.description,
                type: opt.type,
                required: opt.required,
            });
        }

        options = options.sort((a, b) => {
            if (a.required && !b.required) {
                return -1;
            }
            return 0;
        });

        let defaultPermissions = true;
        if (subcommand.disablePermissions ?? false) {
            defaultPermissions = false;
        }

        return {
            "type": InternalCommandOption.SUB_COMMAND,
            "name": subcommand.name,
            "description": subcommand.description,
            "default_permission": defaultPermissions,
            "choices": subcommand.choices,
            "options": options
        }
    }

    public buildDiscordCommandJson(): ApplicationCommandData[] {
        const commands: any[] = [];

        for (const cmd of this.commands.values()) {
            const mainCommandOptions: any[] = [];
            const groups = new Map<string, any>();
            for (const subCommand of cmd.getSubCommands()) {
                if (subCommand.group && subCommand.group.length) {
                    if (!groups.has(subCommand.group)) {
                        groups.set(subCommand.group, [])
                    }
                    const groupContent = groups.get(subCommand.group);
                    groupContent.push(this.createCommandJson(subCommand));
                    groups.set(subCommand.group, groupContent)
                } else {
                    mainCommandOptions.push(this.createCommandJson(subCommand))
                }
            }

            groups.forEach((value: any, key: string) => {
                mainCommandOptions.push({
                    "type": InternalCommandOption.SUB_COMMAND_GROUP,
                    "name": key,
                    "description": "Command " + key,
                    "options": value
                })
            });

            commands.push({
                "name": cmd.getCommandName(),
                "description": cmd.getCommandDescription(),
                "options": mainCommandOptions
            });
        }
        return commands;
    }

    public async publishCommands() {
        getLogger().info('Publishing commands to Discord.');
        await this.client.application!.commands.set(this.buildDiscordCommandJson())
    }
}
