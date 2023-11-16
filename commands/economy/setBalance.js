const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const DatabaseManager = require("../../Databases/databaseManager.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("setbalance")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.setDescription(
			"Overwrites a specific members balance to a given value"
		)
		.addIntegerOption((option) => {
			return option
				.setName("amount")
				.setDescription("The $ amount")
				.setRequired(true)
        })
        .addUserOption((option) => {
            return option
                .setName("user")
                .setDescription("The user to give the balance to")
                .setRequired(true);
        }),

	async execute(interaction) {
        const amount = interaction.options.getInteger("amount");
        const user = interaction.options.getUser("user");

        const q = "SELECT * FROM Balance WHERE Guild = ? AND User = ?";
		const economyDB = DatabaseManager.InitialiseDatabase("economy.db");
		const row = await economyDB.Get(q, [
			interaction.guild.id,
			user.id
		]);

        if(row) {
            await economyDB.RunValues("UPDATE Balance SET Balance = ? WHERE Guild = ? AND User = ?", [amount, interaction.guild.id, user.id]);
            interaction.reply(`Updated ${user.username}'s balance to $${amount} from $${row.Balance}`)

        } else {
            await economyDB.RunValues("INSERT INTO Balance(Guild,User,Balance) VALUES(?,?,?)", [interaction.guild.id, user.id, amount]);
            interaction.reply(`Set ${user.username}'s balance to $${amount}`)
        }

        return economyDB.Close();

    }
};
