# lib/command

## Initialize

Simply initialize the command loader and utilities by running the init function.
It requires a Discord.Client instance. The second parameter points to the directory
where the command classes are stored.

```typescript
import init from "./lib/command/init";

// Load all commands from ./commands directory.
// This will create all required classes and attach to interaction events from Discord client.
await init(client, path.join(__dirname, 'commands'))
```

## Command classes

```typescript
import {CommandInteraction} from "discord.js";
import AbstractCommand from "../lib/command/command";
import {command, group, name, description, option} from "../lib/command/decorators";

@command('mycommand', 'My first command')
export default class MyFirstCommand extends AbstractCommand {
    /**
     * This will create the command `/mycommand subcommand [channel]`
     * 
     * Dynamically called by `AbstractCommand::processInteraction`
     * @param interaction
     */
    @name('subcommand')
    @description('This is a subcommand')
    @option('channel', 'Channel name', 7, true)
    protected async subcommand(interaction: CommandInteraction) {
        await interaction.reply({ embeds: [{
            color: 'GREEN',
            title: 'Hello world',
            description: 'Command was executed successfully.'
        }] });
    }
}
```

### Annotations

#### `@command` (**required**)

Place it at your command class that extends `AbstractCommand`.
It takes the command name and description as arguments.

```typescript
@command((string)'mycommand', (string)'DESCRIPTION')
```

#### `@name` (**required**)

Placed at public methods. Name of the subcommand.

```typescript
@name((string)'subcommand')
```

Assuming the method is placed in a Command class with the above "@command" annotation,
the slash command available on the bot will be `/mycommand subcommand`.

#### `@description` (**required**)

Placed at public methods. Provides the description of the command.

```typescript
@description((string)'This command does awesome things.')
```

#### `@option`

Placed at public methods. Provides available options to the command.

```typescript
@option((string)'NAME', (string)'DESCRIPTION', (number)TYPE, (bool)REQUIRED=false, (array)CHOICES=[])
```

TYPE is the command option type number (see [Discord docs](https://discord.com/developers/docs/interactions/slash-commands#application-command-object-application-command-option-type)).

## Buttons

This utility provides advanced means to create buttons and react to interactions.

New buttons can be created by running `createNewButton` in command classes:

```typescript
this.createNewButton(
    'mybutton', // button id
    'Buttonlabel', // button label
    'PRIMARY', // Button color
    async (interaction) => { // executed when button is pressed
        await interaction.reply({ embeds: [{
            title: 'Hello world',
            description: `Triggered after button click!`
        }] });
    },
    'buttongroup' // optional: button group. when a button is pressed, other buttons in the same group are cleared as well
)
```

### Button timeouts

A timeout can be set on button groups.
In the example below, all buttons of the group "buttongroup" will stop working after 30 seconds.

```typescript
this.createTimeoutForGroup(30, 'buttongroup')
```
