import {Client, CommandInteraction, MessageButton, MessageButtonStyleResolvable} from "discord.js";
import {ButtonCallbackFunc, ButtonInteractionHandler} from "./button_interaction_handler";

export interface ISubCommand {
    name: string;
    description: string;
    group?: string;
    funcName: string;
    options: {name: string; description: string; type: number; required: boolean}[]
}

export default abstract class AbstractCommand {
    protected client: Client;
    protected btnHandler: ButtonInteractionHandler;

    protected commandName: string;
    protected commandDescription: string;

    // do not initialize with empty array! filled by decorators (see decorators.ts)
    // key = method name, value = ISubCommand
    protected subCommands: ISubCommand[];

    constructor(client: Client, btnHandler: ButtonInteractionHandler) {
        this.client = client;
        this.btnHandler = btnHandler;
    }

    public getCommandName(): string {
        return this.commandName;
    }

    public getCommandDescription(): string {
        return this.commandDescription;
    }

    public getSubCommands(): ISubCommand[] {
        return this.subCommands;
    }

    protected getCallerMethodName(): string|null {
        const err = new Error();
        Error.captureStackTrace(err);

        // 1 - DynChannelCommand.getCallerMethodName
        // 2 - DynChannelCommand.createNewButton
        // 3 - DynChannelCommand.<anonymous>
        // 4 - Generator.next <anonymous>
        // 5 - mycommand.js
        // 6 - new Promise
        // 7 - __awaiter
        // 8 - DynChannelCommand.[methodName]
        const caller = err.stack!.split('\n')[8];
        const m = /.*\.(.*)\s/.exec(caller);
        if (m == null) {
            return null;
        }
        return m[1];
    }

    public createTimeoutForGroup(seconds: number, buttonGroup: string, timeoutCallback: null|ButtonCallbackFunc = null) {
        setTimeout(async () => {
            this.btnHandler.unregisterButtonsByGroup(buttonGroup)
            if (timeoutCallback) {
                //await timeoutCallback(interaction)
            }
        }, seconds * 1000);
    }

    protected createNewButton(
        id: string,
        label: string,
        style: MessageButtonStyleResolvable,
        callback: ButtonCallbackFunc,
        buttonGroup = ''
    ) {
        const fullId = `cmd-${this.getCallerMethodName()}-${id}`;
        const button = new MessageButton()
            .setCustomId(fullId)
            .setLabel(label)
            .setStyle(style);
        this.btnHandler._registerButton(button, buttonGroup, callback);
        return button;
    }

    protected deleteButton(button: MessageButton) {
        this.btnHandler._unregisterButton(button);
    }

    public async processInteraction(interaction: CommandInteraction) {
        let funcName = '';
        for (const subCmd of this.getSubCommands()) {
            if (interaction.options.getSubcommandGroup(false)) {
                if (interaction.options.getSubcommandGroup() !== subCmd.group) {
                    continue;
                }
            }
            if (subCmd.name !== interaction.options.getSubcommand()) {
                continue;
            }
            funcName = subCmd.funcName;
            break;
        }

        if ((typeof this[funcName]) !== 'function') {
            await interaction.reply({ embeds: [{
                    color: 'RED',
                    title: 'Oops, an error occurred.',
                    description: 'This command can not be resolved. Please contact the developer.' // todo: add developer name
                }], ephemeral: true });
            return;
        }
        await this[funcName](interaction)
    }
}
