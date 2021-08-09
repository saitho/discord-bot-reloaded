import {ButtonInteraction, MessageButton} from "discord.js";

export type ButtonCallbackFunc = (interaction: ButtonInteraction) => Promise<void>;

type RegisteredButton = { button: MessageButton, buttonGroup: string, once: boolean, callback: ButtonCallbackFunc };

export class ButtonInteractionHandler {
    protected registeredButtons: RegisteredButton[] = [];

    public async handleButtonInteraction(interaction: ButtonInteraction) {
        const button = this.getButton(interaction.customId)
        if (!button) {
            return;
        }
        await button.callback(interaction)
        // trigger button
        if (button.once) {
            this._unregisterButton(button.button);
        }
    }

    public getButton(buttonId: string): RegisteredButton|null {
        for (const button of this.registeredButtons) {
            if (!button) {
                continue;
            }
            if (button.button.customId === buttonId) {
                return button;
            }
        }
        return null;
    }

    public unregisterButtonsByGroup(buttonGroup: string) {
        const buttonsInGroup = this.registeredButtons.filter((b) => b.buttonGroup === buttonGroup);
        for (const b of buttonsInGroup) {
            this._unregisterButton(b.button)
        }
    }

    public _unregisterButton(button: MessageButton) {
        for (const i in  this.registeredButtons) {
            const btn = this.registeredButtons[i]
            if (btn.button === button) {
                delete this.registeredButtons[i]
                if (btn.buttonGroup.length) {
                    this.unregisterButtonsByGroup(btn.buttonGroup)
                }
                return;
            }
        }
    }

    public _registerButton(button: MessageButton, buttonGroup: string, callback: ButtonCallbackFunc, once = true) {
        this.registeredButtons.push({
            button: button,
            buttonGroup: buttonGroup,
            once: once,
            callback: callback
        })
    }
}
