// Main File //
require("dotenv").config();
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const { Client, Collection, Events, GatewayIntentBits, SlashCommandBuilder, PermissionFlagsBits} = require('discord.js');

// Inents to be used by client
const client = new Client({intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,

]});



client.commands = new Collection();
client.cooldowns = new Collection();
const token = process.env.TOKEN;

const timeInitialised = new Date();
const dateString = `${timeInitialised.getDate()}/${timeInitialised.getMonth()}/${timeInitialised.getFullYear()} ${timeInitialised.getHours()}:${timeInitialised.getMinutes()}:${timeInitialised.getSeconds()}`;

exports.timeInitialised = timeInitialised;
exports.dateString = dateString

// Runs When Client Is Online
client.once(Events.ClientReady, c => {
    console.log(`Bot Is Online. Logged in as ${c.user.tag} At ${dateString};`);
})


// Iterates through .js files in ./commands subsequent directories and executes them;
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for(const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for(const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
    
        if('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);     
        } else {
            console.log(`[WARN] The command from path ${filePath} is missing required "data" or "execute" properties`)
        }
    } 

}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for(const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if(event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }

};

let punishmentsDB = new sqlite3.Database('./Databases/punishments.db', sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE, (err) => {
    if(err) return console.error(err.message);
    else console.log('Connected To Database');
})

punishmentsDB.run(`CREATE TABLE IF NOT EXISTS Mutes(Guild STRING, User STRING, MutedUntil STRING)`)
.run(`CREATE TABLE IF NOT EXISTS Users(Guild STRING, User STRING, Warnings INTEGER, IsMuted STRING, IsTimedOut STRING)`);

punishmentsDB.close();



//Keep At Bottom
client.login(token);