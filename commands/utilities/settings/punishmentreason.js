const { ActionRowBuilder, EmbedBuilder} = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
    async execute(interaction) {
        const reason = interaction.options.getString('reason');
        const guild = interaction.guild;

        if(reason.length > 100 | reason.length < 1) return interaction.reply({content: 'The reason must be no more than 100 characters', ephemeral: true})

        let guildsDB = new sqlite3.Database('./Databases/guilds.db', sqlite3.OPEN_READWRITE, (err) => {
            if(err) return console.error(err.message);
        });


        const q = 'SELECT * FROM Settings WHERE Guild = ?';
        guildsDB.get(q, [guild.id], async (err, row) => {
            if(err) return console.error(err.message);

            try {
                if(row) {
                    guildsDB.run(`UPDATE Settings SET DefaultPunishReason = ? WHERE Guild = ?`, [reason, guild.id]);
                } else {
                    guildsDB.run(`INSERT INTO Settings(Guild,WarningDuration,LimboRole,DefaultPunishReason) VALUES (?,?,?,?)`,
                    [guild.id, null, null, reason]);
                }
                guildsDB.close();
            } catch(e) {
                console.error(e);
                return interaction.reply('There was an unexpected error writing to the database', {ephemeral: true});
            }

            return interaction.reply(`The message "${reason}" has been set as the default punishment message`, {ephemeral: true});

        })


    }
}