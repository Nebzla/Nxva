const DatabaseManager = require("../../../Databases/databaseManager.js");

module.exports = {
	async execute(interaction) {
		const reason = interaction.options.getString("reason");
		const guild = interaction.guild;

		if ((reason.length > 100) | (reason.length < 1))
			return interaction.reply({
				content: "The reason must be no more than 100 characters",
				ephemeral: true,
			});


		const guildsDB = DatabaseManager.InitialiseDatabase("guilds.db");
		const q = "SELECT * FROM Settings WHERE Guild = ?";
		const row = guildsDB.Get(q, [guild.id]);

		try {
			if (row) {
				guildsDB.RunValues(
					"UPDATE Settings SET DefaultPunishReason = ? WHERE Guild = ?",
					[reason, guild.id],
				);
			} else {
				guildsDB.RunValues(
					"INSERT INTO Settings(Guild,WarningDuration,LimboRole,DefaultPunishReason) VALUES (?,?,?,?)",
					[guild.id, null, null, reason],
				);
			}
			guildsDB.Close();
		} catch (e) {
			console.error(e);
			return interaction.reply(
				"There was an unexpected error writing to the database",
				{ ephemeral: true },
			);
		}

		return interaction.reply(
			`The message "${reason}" has been set as the default punishment message`,
			{ ephemeral: true },
		);
	},
};
