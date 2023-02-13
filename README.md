# Archiver-bot
A discord bot used to move messages from a server to another for archival purposes.

# Requirements
You will need nodejs 18.12.1 or higher to run this bot (might run on versions before this one but I didn't test that).

# Instalation

- Download the repository into the device the will run this bot.
- Unzip the folder into a directory of your preference. You should have something like `your-directory/Archiver-bot`.
- Open your terminal or command like and navigate to `your-directory/Archiver-bot`.
- Run the command ```npm install --production```. This will install all the dependencies the bot needs to run but not the ones needed for development.
- If everything went right, now the only thing left to do is some setup. See the following section for this.

# Setup

- Make a copy of the `.env.example` and rename it to `.env`
- Inside the file you will see three variables: `DISCORD_TOKEN`, `CLIENT_ID` and `DATA_DIRECTORY`. All of these need to be changed to proper values
- `DATA_DIRECTORY` is used to store some data files the bot uses for its functions. Simply set this variable to a path to an existing directory of your choice.
- `DISCORD_TOKEN` and `CLIENT_ID` are used for bot authentication and to register the / commands. To get these you need to create an app at https://discord.com/developers/applications. Once this is done both of this values can be found at the app page. The `CLIENT_ID` should in the section `General Information` under the name of `application id`. The `DISCORD_TOKEN` should be the `Bot` section.
- In the `Bot` section there should be a place in that page with the title `Privileged Gateway Intents`. You will need to turn on the one that says `Message content intent`. This is needed because for the bot to move messages from one channel to another it needs to retrieve the messages and see their content.
- After all this is done the last thing you need to do is run the command `npm run deploycmds` in the same terminal you opened earlier. This will register the commands so people can use them.
- You are done. If there were no errors you can now close your terminal.

# Run the Bot
- Open a terminal and navigate to `your-directory/Archiver-bot`.
- Run the command `npm start`.

# Updating the Bot
The bot is still under active development so new features maybe added and bug fixes. When this happens, if you want the updates, the files you need are the ones in `dist/` directory and the `package.json` and `package-lock.json`. Once you have retrieved them:

- Open a terminal and navigate to `your-directory/Archiver-bot`.
- Run the command `npm install` and `npm run deploycmds` and that should be it.