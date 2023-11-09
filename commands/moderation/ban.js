const { ActionRowBuilder, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder} = require('discord.js');
const stylings = require('../../stylings.js');
const settings = require('../utilities/settings.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDescription('Bans a user.')
        
        .addUserOption(option => {
            return option.setName('user')
                .setDescription('The user that you would like to take action against')
                .setRequired(true)
        })
        .addStringOption(option => {
            return option.setName('reason')
                .setDescription('The reason for banning them, defaults to standard in settings')
        }),
        async execute(interaction, client) {

            //Get options from slash command
            const guild = interaction.guild;
            const target = interaction.options.getUser('user');
            const guildTarget = await guild.members.fetch(target.id);
            const defaultReason = await settings.GetDefaultReason(guild.id);

            const reason = interaction.options.getString('reason') ?? (defaultReason ?? 'None');


            const actionRow = new ActionRowBuilder()
            .addComponents(stylings.buttons.confirm, stylings.buttons.cancel)

            const confirmEmbed = new EmbedBuilder()
            .setTitle('Confirm Ban')
            .setColor('Red')
            .setDescription(`
**User:** ${target.globalName}
**Issued By:** ${interaction.user.globalName}

**Reason:** ${reason}
            `)

            const publicEmbed = new EmbedBuilder()
            .setTitle('User Banned')
            .setColor('Red')
            .setDescription(`
**User:** ${target.globalName}
**Reason:** ${reason}
           `)

 
 
            const resp = await interaction.reply({
                embeds: [confirmEmbed],
                components: [actionRow],
               ephemeral: true,
            });

            // Listens for a button interaction from the user who ran the command
            const collectFilter = x => x.user.id === interaction.user.id;
            try {
                const c = await resp.awaitMessageComponent({filter: collectFilter, time: 60_000})

                // Bans if confirm button is pressed
                if(c.customId === 'confirm') {
                    
                    guildTarget.ban({reason: reason})
                    .then(async () => {
                        await c.channel.send({embeds: [publicEmbed], components: [], ephemeral: false})
                        await interaction.deleteReply();  
                    })
                    .catch(async () => {
                        return interaction.editReply({content: 'I was unable to ban the user, sorry. Please check I have the necessary permissions to do so ', embeds: [], components: []})

                    })

                
                } else if(c.customId === 'cancel') {
                     await c.update({embeds: [stylings.embeds.cancelled], components: []});
                }   

            // Catches interaction failiure if no response is given
            } catch(e) {
                 await interaction.editReply({ content: 'The interaction timed out.', embeds: [], components: [] });
            }
        }
    }