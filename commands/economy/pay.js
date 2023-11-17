const { SlashCommandBuilder } = require("discord.js");
const DatabaseManager = require("../../Databases/databaseManager");
const { CreateBalance } = require("../utilities/settings");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("pay")
		.setDescription("Pays a user money from your balance")
		.addIntegerOption((option) => {
			return option
				.setName("amount")
				.setDescription("The $ anount to pay")
				.setRequired(true)
        })
        .addUserOption((option) => {
            return option
                .setName("user")
                .setDescription("The user to give the money to")
                .setRequired(true);
        }),

	async execute(interaction) {
        const amount = interaction.options.getInteger("amount");
        const target = interaction.options.getUser("user");
        const economyDB = DatabaseManager.InitialiseDatabase("economy.db");

        let q = "SELECT * FROM Balance WHERE Guild = ? AND User = ?";

        const targetRow = await economyDB.Get(q, [interaction.guild.id, target.id])
        const payeeRow = await economyDB.Get(q, [interaction.guild.id, interaction.user.id])


        if(!targetRow) return interaction.reply(`That user doesn\'t have a balance setup, tell them to set one up before paying them`);
        if(!payeeRow) {
            CreateBalance()
            return interaction.reply(`You don\'t have a balance, i've created one for you, please try again`);
        }

        if(amount < 0) return interaction.reply("Are you trying to make them pay you? You can't take money off them you muppet");
        if(payeeRow.Balance < amount) return interaction.reply("You don\'t have enough money, nice try");
        
        const payeeRemainingBalance = parseInt(payeeRow.Balance) - parseInt(amount);
        const targetNewBalance = parseInt(targetRow.Balance) + parseInt(amount);


        q = "UPDATE Balance SET Balance = ? WHERE Guild = ? AND User = ?";
        economyDB.RunValues(q, [payeeRemainingBalance, interaction.guild.id, interaction.user.id]);
        economyDB.RunValues(q, [targetNewBalance, interaction.guild.id, target.id]);

        economyDB.Close();
        return interaction.reply(`I've paid ${target.username} $${amount}`);


    }
};