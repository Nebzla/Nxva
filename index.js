// Main File //
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const settings = require("./commands/utilities/settings");

const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");

// Intents to be used by client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildModeration,
	],
});

client.commands = new Collection();
client.cooldowns = new Collection();
const token = process.env.TOKEN;

const timeInitialised = new Date();
const dateString = `${timeInitialised.getDate()}/${
	timeInitialised.getMonth() + 1
}/${timeInitialised.getFullYear()} ${timeInitialised.getHours()}:${timeInitialised.getMinutes()}:${timeInitialised.getSeconds()}`;

exports.timeInitialised = timeInitialised;
exports.dateString = dateString;

// Executes When Client Is Online
client.once(Events.ClientReady, (c) => {
	console.log(`Bot Is Online. Logged in as ${c.user.tag} At ${dateString};`);
});

// Iterates through .js slash commands in ./commands subsequent directories and executes them;
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
			client.commands.set(command.data.name, command);
		} else {
			console.log(
				`[WARN] The command from path ${filePath} is missing required "data" or "execute" properties`
			);
		}
	}
}

//Iterates through events directory and enables the respective listeners in the directory
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
	.readdirSync(eventsPath)
	.filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}


const DatabaseManager = require("./Databases/databaseManager.js");

const punishmentsDB = DatabaseManager.InitialiseDatabase("punishments.db");
const guildsDB = DatabaseManager.InitialiseDatabase("guilds.db");
const economyDB = DatabaseManager.InitialiseDatabase("economy.db");


economyDB.CreateTable("Balance", DatabaseManager.CreateColumnsArray(["Guild", "Text", "User", "Text", "Balance", "Text"]));
guildsDB.CreateTable("Settings", DatabaseManager.CreateColumnsArray(["Guild", "Text", "WarningDuration", "Text", "LimboRole", "Text", "DefaultPunishReason", "Text", "StartingBalance", "Integer"]));
punishmentsDB.CreateTable("Limbos", DatabaseManager.CreateColumnsArray(["Guild", "Text", "User", "Text", "Reason", "Text", "LostRoles", "Text"]));
punishmentsDB.CreateTable("Warnings", DatabaseManager.CreateColumnsArray(["Guild", "Text", "User", "Text", "Warnings", "Integer", "WarningExpiry", "Text", "WarningReasons", "Text"]));

DatabaseManager.CloseAllDatabases();

setInterval(settings.RemoveWarningsCheck, 60000);

//Keep At Bottom
client.login(token);
