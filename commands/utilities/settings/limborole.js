const { ActionRowBuilder, EmbedBuilder } = require("discord.js");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

module.exports = {
	async execute(interaction) {
		const role = interaction.options.getRole("role");
		const guild = interaction.guild;

		let guildsDB = new sqlite3.Database(
			"./Databases/guilds.db",
			sqlite3.OPEN_READWRITE,
			(err) => {
				if (err) return console.error(err.message);
			},
		);

		// NTS Add a listener for guild leave at some point
		const q = "SELECT * FROM Settings WHERE Guild = ?";
		guildsDB.get(q, [guild.id], async (err, row) => {
			if (err) return console.error(err.message);

			try {
				if (row) {
					guildsDB.run(
						`UPDATE Settings SET LimboRole = ? WHERE Guild = ?`,
						[role.id, guild.id],
					);
				} else {
					guildsDB.run(
						`INSERT INTO Settings(Guild,WarningDuration,LimboRole,DefaultPunishReason) VALUES (?,?,?,?)`,
						[guild.id, null, role.id, null],
					);
				}
				guildsDB.close();
			} catch (e) {
				console.error(e);
				return interaction.reply(
					"There was an unexpected error writing to the database",
					{ ephemeral: true },
				);
			}

			return interaction.reply(
				`The role ${role.name} has been set as the limbo role`,
				{ ephemeral: true },
			);
		});
	},
};
