const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Responds with how long the bot has been online for.'),
    async execute(interaction) {

        const index = require('../../index.js');
        const ms = require('ms');

        const dateDifference = (new Date().getTime() - index.timeInitialised.getTime());
        const dateDifferenceString = ms(dateDifference, {long: true});


        await interaction.reply(`I've been online for ${dateDifferenceString}, since ${index.dateString}`);  
    }
}