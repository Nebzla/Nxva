const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { InitialiseDatabase } = require("../../Databases/databaseManager");
const { InsertCommas } = require("../../utilities.js")


// Also do this for a set member
module.exports = {
	data: new SlashCommandBuilder()
		.setName("baltop")
		.setDescription("Displays the users with the top 10 highest bank balances in the server."),
	async execute(interaction) {
        const guild = interaction.guild;

        const economyDB = InitialiseDatabase("economy.db")
        const q = "SELECT * FROM Balances WHERE Guild = ? ORDER BY Balance DESC";
        const rows = await economyDB.GetAll(q, [guild.id]);
        if(rows.length === 0) return interaction.reply("No one has a balance you muppet");

        let leaderboardString = "";
        let p = 1;

        await rows.forEach(async (row, i) => {
            const userId = row.User;
            const balance = row.Balance;

            if(p > 10) return;
            const member = await guild.members.fetch(userId);
            if(member) {
                if(!member.user.bot) {
                    leaderboardString += `(${p}) ${member.nickname || member.user.globalName || member.user.username}: $${InsertCommas(balance)}\n`;
                    p++;
                };
            };

        });


        return interaction.reply({embeds: [new EmbedBuilder()
            .setColor('Blue')
            .setTitle(`${guild.name} Balance Leaderboard`)
            .setDescription(leaderboardString !== "" ? leaderboardString : "Error")
        ]});

    }
}