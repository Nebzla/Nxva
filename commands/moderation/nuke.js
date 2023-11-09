const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('Removes up to 100 of the most recent messages in a channel.')
        .addIntegerOption(option => {
            return option.setName('messages')
            .setDescription('The amount of messages to delete (<100)')
            .setRequired(true)
        }),
    async execute(interaction) {
        const qty = interaction.options.getInteger('messages');
        if(qty < 1 || qty > 100) return interaction.reply({content: "It must be in the range 1-100, Discord currently doesn\'t allow for bulk deleting over 100 messages", ephemeral: true});
        
        interaction.channel.bulkDelete(qty)
        .then(() => {
            return interaction.reply({content: "Messages Deleted", ephemeral: true});
        })
        .catch((e) => {
            console.error(e);
        })

    }
}