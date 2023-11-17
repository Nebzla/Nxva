const { SlashCommandBuilder } = require("discord.js");
const DatabaseManager = require("../../Databases/databaseManager");
const { CreateBalance } = require("../../commands/utilities/settings.js");
const { InsertCommas } = require("../../utilities.js")


// Also do this for a set member
module.exports = {
	data: new SlashCommandBuilder()
		.setName("balance")
		.setDescription("Displays your current balance.")
        .addUserOption((option) => {
			return option
				.setName("user")
				.setDescription(
					"The user who's balance you would like to view",
				)
				.setRequired(false);
		}),
	async execute(interaction) {
        let user = interaction.options.getUser("user");
        if(!user) user = interaction.user;

		const q = "SELECT * FROM Balance WHERE Guild = ? AND User = ?";
		const economyDB = DatabaseManager.InitialiseDatabase("economy.db");
		const row = await economyDB.Get(q, [
			interaction.guild.id,
			user.id,
		]);

        economyDB.Close();

		if (row) {
            return interaction.reply(`Current balance is $${InsertCommas(row.Balance)}`);
        } else {
            CreateBalance(interaction.guild.id, user.id);
            return interaction.reply("You don't currently have a balance, I'll give you the starting balance now");
        }
	},
};
