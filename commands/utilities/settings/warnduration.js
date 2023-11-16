const ms = require("ms");
const DatabaseManager = require("../../../Databases/databaseManager.js");

module.exports = {
	async execute(interaction) {
		const duration = interaction.options.getString("duration");
		const guild = interaction.guild;
		const durationMs = ms(duration);

		if (!durationMs)
			return interaction.reply({
				content:
					"Unable to parse the duration supplied, please make sure you follow the format",
				ephemeral: true,
			});


		const guildsDB = DatabaseManager.InitialiseDatabase("guilds.db");
		const q = "SELECT * FROM Settings WHERE Guild = ?";
		const row = await guildsDB.Get(q, [guild.id]);

		try {
			if (row) {
				guildsDB.RunValues(
					"UPDATE Settings SET WarningDuration = ? WHERE Guild = ?",
					[durationMs, guild.id],
				);
			} else {
				guildsDB.RunValues(
					"INSERT INTO Settings(Guild,WarningDuration) VALUES (?,?)",
					[guild.id, durationMs],
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
			`Warnings will now expire after ${ms(durationMs, {
				long: true,
			})}`,
			{ ephemeral: true },
		);
	},
};
