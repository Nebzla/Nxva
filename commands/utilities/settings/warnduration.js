const { ActionRowBuilder, EmbedBuilder} = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const ms = require('ms');

module.exports = {
    async execute(interaction) {
        const duration = interaction.options.getString('duration');
        const guild = interaction.guild;
        const durationMs = ms(duration);

        if(!durationMs) return interaction.reply({content: 'Unable to parse the duration supplied, please make sure you follow the format', ephemeral: true})

        let guildsDB = new sqlite3.Database('./Databases/guilds.db', sqlite3.OPEN_READWRITE, (err) => {
            if(err) return console.error(err.message);
        });

        const q = 'SELECT * FROM Settings WHERE Guild = ?';
        guildsDB.get(q, [guild.id], async (err, row) => {
            if(err) return console.error(err.message);
            
            try {
                if(row) {
                    guildsDB.run(`UPDATE Settings SET WarningDuration = ? WHERE Guild = ?`, [durationMs, guild.id]);
                } else {
                    guildsDB.run(`INSERT INTO Settings(Guild,WarningDuration,LimboRole,DefaultPunishReason) VALUES (?,?,?,?)`,
                    [guild.id, durationMs, null, null]);
                }
                guildsDB.close();
            } catch(e) {
                console.error(e);
                return interaction.reply('There was an unexpected error writing to the database', {ephemeral: true});
            }

            return interaction.reply(`Warnings will now expire after ${ms(durationMs, {long: true})}`, {ephemeral: true});
        })
    }
}