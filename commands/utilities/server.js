const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Responds with information about the current server'),
    async execute(interaction, client) {
        const guild = interaction.guild;

        const serverEmbed = new EmbedBuilder()
        .setColor('#036ffc')
        .setTitle(guild.name)
        .setDescription(
`Created: ${guild.createdAt.getDate()}/${guild.createdAt.getMonth()}/${guild.createdAt.getFullYear()} ${guild.createdAt.getHours()}:${guild.createdAt.getMinutes()}
Max Members: ${guild.maximumMembers}
Total Members: ${guild.memberCount}
Guild Description: ${guild.description}
Author ID: ${guild.ownerId}
Icon Hash: ${guild.icon}
Banner Hash: ${guild.banner}
Maximum Bitrate: ${guild.maximumBitrate}
Server Boosts: ${guild.premiumSubscriptionCount}
Rules Channel ID: ${guild.rulesChannelId}
Partnered?: ${guild.partnered}
Verified?: ${guild.verified}
Verification Level: ${guild.verificationLevel}
Vanity URL Uses: ${guild.vanityURLUses}

        `);

        interaction.reply({ embeds: [serverEmbed]});

        //interaction.reply('')
    }

}