const {
	ActionRowBuilder,
	SlashCommandBuilder,
	PermissionFlagsBits,
	EmbedBuilder,
} = require("discord.js");

const DatabaseManager = require("../../Databases/databaseManager.js");
const stylings = require("../../stylings");
const settings = require("../utilities/settings.js");
const ms = require("ms");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("warn")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.setDescription(
			"Warns a user. Will be purely cosmetic to their profile unless warning punishments are setup"
		)

		.addUserOption((option) => {
			return option
				.setName("user")
				.setDescription("The user that you would like to warn")
				.setRequired(true);
		})
		.addStringOption((option) => {
			return option
				.setName("reason")
				.setDescription(
					"The reason for warning them, defaults to standard in settings"
				);
		}),
	async execute(interaction) {
		const punishmentsDB =
			DatabaseManager.InitialiseDatabase("punishments.db");

		const guild = interaction.guild;
		const target = interaction.options.getUser("user");

		const defaultReason = await settings.FetchSetting(guild.id, "DefaultPunishReason");
		const reason =
			interaction.options.getString("reason") ?? defaultReason ?? "None";

		const duration = await settings.FetchSetting(guild.id, "WarningDuration");
		if (!duration)
			return interaction.reply({
				content: "You haven't setup a warning duration in settings!",
				ephemeral: true,
			});
		const warningExpiry = Date.now() + parseInt(duration);

		const q = "SELECT * FROM Warnings WHERE Guild = ? AND User = ?";
		const row = await punishmentsDB.Get(q, [guild.id, target.id]);

		let warnings = 1;
		let warnReasons = [];

		if (row) {
			warnings += row.Warnings;
			warnReasons = JSON.parse(row.WarningReasons);
		}

		warnReasons.push(reason);

		const confirmEmbed = new EmbedBuilder()
			.setTitle("Confirm Warn")
			.setColor("Orange").setDescription(`
**User:** ${target.globalName}
**Issued By:** ${interaction.user.globalName}
    
**Previous Warnings:** ${warnings - 1}
**Warn Reason:** ${reason}
**Expires In:** ${ms(parseInt(duration), { long: true })} 

                `);
		const publicEmbed = new EmbedBuilder()
			.setTitle("User Warned")
			.setColor("Orange").setDescription(`
**User:** ${target.globalName}
    
**Total Warnings:** ${warnings}
**Warn Reason:** ${reason}
**Expires In:** ${ms(parseInt(duration), { long: true })}

                `);

		const actionRow = new ActionRowBuilder().addComponents(
			stylings.buttons.confirm,
			stylings.buttons.cancel
		);

		const resp = await interaction.reply({
			embeds: [confirmEmbed],
			components: [actionRow],
			ephemeral: true,
		});

		// Listens for a button interaction from the user who ran the command
		const collectFilter = (x) => x.user.id === interaction.user.id;
		try {
			const c = await resp.awaitMessageComponent({
				filter: collectFilter,
				time: 60_000,
			});
			//Warns if confirm button is pressed
			if (c.customId === "confirm") {
				// Updates Current Entry if it already exists
				if (row) {
					punishmentsDB.run(
						"UPDATE Warnings SET Warnings = ?, WarningExpiry = ?, WarningReasons = ? WHERE Guild = ? AND User = ?",
						[
							warnings,
							warningExpiry,
							JSON.stringify(warnReasons),
							guild.id,
							target.id,
						]
					);
				} else {
					punishmentsDB.run(
						"INSERT INTO Warnings(Guild,User,Warnings,WarningExpiry,WarningReasons) VALUES(?,?,?,?,?)",
						[
							guild.id,
							target.id,
							warnings,
							warningExpiry,
							JSON.stringify(warnReasons),
						]
					);
				}
				punishmentsDB.close();

				await c.channel.send({
					embeds: [publicEmbed],
					components: [],
					ephemeral: false,
				});
				await interaction.deleteReply();
			} else if (c.customId === "cancel") {
				await c.update({
					embeds: [stylings.embeds.cancelled],
					components: [],
				});
			}

			// Catches interaction failiure if no response is given
		} catch (e) {
			await interaction.editReply({
				content:
					"Confirmation not received within 1 minute, cancelling",
				components: [],
			});
		}
	},
};
