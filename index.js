// Main File //
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const settings = require("./commands/utilities/settings");

const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
} = require("discord.js");

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

//Sets up local databases to be used;
let punishmentsDB = new sqlite3.Database(
  "./Databases/punishments.db",
  sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) return console.error(err.message);
  }
);
let guildsDB = new sqlite3.Database(
  "./Databases/guilds.db",
  sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) return console.error(err.message);
  }
);

guildsDB.run(
  "CREATE TABLE IF NOT EXISTS Settings(Guild TEXT, WarningDuration TEXT, LimboRole TEXT, DefaultPunishReason TEXT)"
);

punishmentsDB
  //.run(`CREATE TABLE IF NOT EXISTS Mutes(Guild TEXT, User TEXT, IsPermanent INTEGER NOT NULL, MutedUntil TEXT, Reason TEXT)`)
  .run(
    "CREATE TABLE IF NOT EXISTS Limbos(Guild TEXT, User TEXT, Reason TEXT, LostRoles TEXT)"
  )
  .run(
    "CREATE TABLE IF NOT EXISTS Warnings(Guild TEXT, User TEXT, Warnings INTEGER, WarningExpiry TEXT, WarningReasons TEXT)"
  ); // Will expire as defined by server owner from latest warning issued
punishmentsDB.close();
guildsDB.close();

setInterval(settings.RemoveWarningsCheck, 60000);

//Keep At Bottom
client.login(token);
