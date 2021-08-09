# saitho's Discord bot

**Note:**
This is mainly a personal bot. I do not guarantee it works and it probably won't get any new features or updates/maintainance.

## Usage

Rename the `config.json.dist` to `config.json` and set your own bot token.

You can find a Docker image here: TBD
Make sure to mount the config.json at `/app/config.json` and the SQLite database at `/app/dist/database.sqlite3`.

### Note on Slash commands

Make sure to set the `PUBLISH_COMMANDS` environment to 1 when running the application on your main bot
to publish the actual Slash Commands to Discord.

You can list all commands registered to your application by
sending a GET request to https://discord.com/api/v8/applications/<YOUR_APPLICATION_ID>/commands .
(Auth with "Authorization: Bot [token]" header)
