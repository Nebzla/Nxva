const DatabaseManager = require("../../../Databases/databaseManager.js");

module.exports = {
	async execute(interaction) {
		const role = interaction.options.getRole("role");
		const guild = interaction.guild;

		const guildsDB = DatabaseManager.InitialiseDatabase("guilds.db");
		const q = "SELECT * FROM Settings WHERE Guild = ?";
		const row = await guildsDB.Get(q, [guild.id]);
		
		try {
			if (row) {
				guildsDB.RunValues(
					"UPDATE Settings SET LimboRole = ? WHERE Guild = ?",
					[role.id, guild.id]
				);
			} else {
				guildsDB.RunValues(
					"INSERT INTO Settings(Guild,LimboRole) VALUES (?,?)",
					[guild.id, role.id]
				);
			}
			
			guildsDB.Close();

		} catch (e) {
			console.error(e);
			return interaction.reply(
				"There was an unexpected error writing to the database",
				{ ephemeral: true }
			);
		}

		return interaction.reply(
			`The role ${role.name} has been set as the limbo role`,
		);
	},
};
