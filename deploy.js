// Deploys All Slash Commands Guild-Wide;

require("dotenv").config();
const { REST, Routes } = require("discord.js");
const appID = process.env.APPID;
const guildID = process.env.TESTGUILDID;

const fs = require("fs");
const path = require("path");

const commands = [];

// Iterates through .js files in ./commands subsequent directories and executes them;
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) => file.endsWith(".js"));

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);

		if ("data" in command && "execute" in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(
				`[WARN] The command from path ${filePath} is missing required "data" or "execute" properties`,
			);
		}
	}
}

//Refreshes slash commands in the guild specified in .env
const rest = new REST().setToken(process.env.TOKEN);
(async () => {
	try {
		console.log(
			`Initialising Refreshing of ${commands.length} application (/) commands`,
		);

		const data = await rest.put(
			Routes.applicationGuildCommands(appID, guildID),
			{ body: commands },
		);

		console.log(
			`Sucessfully (re)loaded ${data.length} application commands`,
		);
	} catch (error) {
		console.error(error);
	}
})();
