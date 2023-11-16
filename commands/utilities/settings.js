//Used To Configure Moderation Settings in a discord server
// /Settings show
// /Settings <setting> <value>
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const path = require("path");
const DatabaseManager = require("../../Databases/databaseManager.js");

module.exports = {
	RemoveWarningsCheck: RemoveWarningsCheck,
	FetchSetting: FetchSetting,
	CreateBalance: CreateBalance,
	ResetBalance: ResetBalance,

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
		)
		.addSubcommand((command) =>
		command
			.setName("startingbalance")
			.setDescription(
				"The default bank balance a user starts with when joining the server",
			)
			.addIntegerOption((option) =>
				option
					.setName("amount")
					.setDescription(
						"The $ amount",
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
			case "startingbalance":
				filePath = path.join(settingsDir, "startingbalance");
				break;
			default:
				return interaction.reply("Error");
		}

		const setting = require(filePath);
		setting.execute(interaction); // Hands off to specific setting file by calling the execute function within
	},
};

async function FetchSetting(guildId, setting) {
		const guildsDB = DatabaseManager.InitialiseDatabase("guilds.db");
		const q = "SELECT * FROM SETTINGS WHERE Guild = ?";
		

		const row = await guildsDB.Get(q, guildId);
		guildsDB.Close();

		if(!row) return undefined;
		
		const _setting = row[setting];
		if(!_setting) return null;
		else return _setting;

}

async function CreateBalance(guild, user) {
    const economyDB = DatabaseManager.InitialiseDatabase("economy.db");
    const q = "INSERT INTO Balance(Guild, User, Balance) VALUES(?,?,?)";
    
	const startingBalance = await FetchSetting(guild, "StartingBalance");
	if(startingBalance) economyDB.RunValues(q, [guild, user, startingBalance]);
	else economyDB.RunValues(q, [guild, user, 100]);

	economyDB.Close();
}

async function ResetBalance(guild, user) {
	const economyDB = DatabaseManager.InitialiseDatabase("economy.db");
	const q = "DELETE FROM Balance WHERE Guild = ? AND User = ?";
	try {
		await economyDB.RunValues(q, [guild, user]);
		economyDB.Close();

		CreateBalance(guild, user);
	} catch (err) {
		console.error(err);
	}


}


async function RemoveWarningsCheck() {
	const now = Date.now();

	const punishmentsDB = DatabaseManager.InitialiseDatabase("punishments.db");
	const q = "SELECT * FROM Warnings";

	const rows = await punishmentsDB.GetAll(q, []);
	punishmentsDB.Close();

	if(!rows) return;

	rows.forEach((row) => {
		if (parseInt(row.WarningExpiry) - now < 0) {
			punishmentsDB.run(
				"DELETE FROM Warnings WHERE User = ? AND Guild = ?",
				[row.User, row.Guild],
			);
		}
	});
}
