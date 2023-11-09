const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Replies with invite link.'),
    async execute(interaction) {
        await interaction.reply('https://tinyurl.com/nxvainvite');  
    }
}