const DatabaseManager = require("../../../Databases/databaseManager.js");

module.exports = {
	async execute(interaction) {

        const amount = interaction.options.getInteger("amount");

        const guildsDB = DatabaseManager.InitialiseDatabase("guilds.db");
        const q = "SELECT * FROM Settings WHERE Guild = ?";
		const row = await guildsDB.Get(q, [interaction.guild.id]);

        if(row) {
            guildsDB.RunValues("UPDATE Settings SET StartingBalance = ? WHERE Guild = ?", [amount, interaction.guild.id]);
            guildsDB.Close();
        } else {
            guildsDB.RunValues("INSERT INTO Settings(Guild,StartingBalance) VALUES (?,?)", [interaction.guild.id, amount]);
        }

        return interaction.reply(`$${amount} has been set as the default starting balance`);

    }
};