//Used To Configure Moderation Settings in a discord server
// /Settings show
// /Settings <setting> <value>
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

module.exports = {
	RemoveWarningsCheck: RemoveWarningsCheck,
	GetLimboRoleId: GetLimboRoleId,
	GetDefaultReason: GetDefaultReason,
	GetWarningDuration: GetWarningDuration,

	data: new SlashCommandBuilder()
		.setName("settings")
		.setDescription("Configure your servers' bot settings")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

		.addSubcommand((command) =>
			command
				.setName("limborole")
				.setDescription(
					"Set the role that is applied to a user when they're put in limbo",
				)
				.addRoleOption((option) =>
					option
						.setName("role")
						.setDescription("The role")
						.setRequired(true),
				),
		)

		.addSubcommand((command) =>
			command
				.setName("warnduration")
				.setDescription("Set how long warnings last until they expires")
				.addStringOption((option) =>
					option
						.setName("duration")
						.setDescription("The duration (5d, 60d, 1y, 5s)")
						.setRequired(true),
				),
		)

		.addSubcommand((command) =>
			command
				.setName("punishmentreason")
				.setDescription(
					"The default reason given when none are provided",
				)
				.addStringOption((option) =>
					option
						.setName("reason")
						.setDescription(
							"The default reason (EG: For being a muppet)",
						)
						.setRequired(true),
				),
		),
	async execute(interaction) {
		const settingsDir = path.join(__dirname, "settings");
		const subcommand = interaction.options.getSubcommand();
		let filePath;

		switch (subcommand) {
			case "limborole":
				filePath = path.join(settingsDir, "limborole");
				break;
			case "warnduration":
				filePath = path.join(settingsDir, "warnduration");
				break;
			case "punishmentreason":
				filePath = path.join(settingsDir, "punishmentreason");
				break;
			default:
				return interaction.reply("Error");
		}

		const setting = require(filePath);
		setting.execute(interaction); // Hands off to specific setting file by calling the execute function within
	},
};

function GetLimboRoleId(guildId) {
	return new Promise((resolve, reject) => {
		let guildsDB = new sqlite3.Database(
			"./Databases/guilds.db",
			sqlite3.OPEN_READONLY,
			(err) => {
				if (err) return console.error(err.message);
			},
		);

		guildsDB.get(
			"SELECT * FROM Settings WHERE Guild = ?",
			[guildId],
			async (err, row) => {
				if (err) {
					reject();
					return console.error(err.message);
				}

				if (row) resolve(row.LimboRole);
				else resolve(null);
			},
		);

		guildsDB.close();
	});
}

function GetDefaultReason(guildId) {
	return new Promise((resolve, reject) => {
		let guildsDB = new sqlite3.Database(
			"./Databases/guilds.db",
			sqlite3.OPEN_READONLY,
			(err) => {
				if (err) return console.error(err.message);
			},
		);

		guildsDB.get(
			"SELECT * FROM Settings WHERE Guild = ?",
			[guildId],
			async (err, row) => {
				if (err) {
					reject();
					return console.error(err.message);
				}

				if (row) resolve(row.DefaultPunishReason);
				else resolve(null);
			},
		);

		guildsDB.close();
	});
}

function GetWarningDuration(guildId) {
	return new Promise((resolve, reject) => {
		let guildsDB = new sqlite3.Database(
			"./Databases/guilds.db",
			sqlite3.OPEN_READONLY,
			(err) => {
				if (err) return console.error(err.message);
			},
		);

		guildsDB.get(
			"SELECT * FROM Settings WHERE Guild = ?",
			[guildId],
			async (err, row) => {
				if (err) {
					reject();
					return console.error(err.message);
				}

				if (row) resolve(row.WarningDuration);
				else resolve(null);
			},
		);

		guildsDB.close();
	});
}

function RemoveWarningsCheck() {
	const now = Date.now();

	let punishmentsDB = new sqlite3.Database(
		"./Databases/punishments.db",
		sqlite3.OPEN_READWRITE,
		(err) => {
			if (err) return console.error(err.message);
		},
	);

	const q = "SELECT * FROM Warnings";
	punishmentsDB.all(q, [], async (err, rows) => {
		if (err) return console.error(err.message);

		rows.forEach((row) => {
			if (parseInt(row.WarningExpiry) - now < 0) {
				punishmentsDB.run(
					"DELETE FROM Warnings WHERE User = ? AND Guild = ?",
					[row.User, row.Guild],
				);
			}
		});
	});
}
