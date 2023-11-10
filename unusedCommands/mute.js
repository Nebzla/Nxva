const {
	ActionRowBuilder,
	SlashCommandBuilder,
	PermissionFlagsBits,
	EmbedBuilder,
} = require("discord.js");
const ms = require("ms");
const sqlite3 = require("sqlite3").verbose();
const stylings = require("../stylings.js");

// Change to limbo eventually

module.exports = {
	data: new SlashCommandBuilder()
		.setName("mute")
		.setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
		.setDescription(
			"Mutes a user. Requires mute role to be setup in settings",
		)

		.addUserOption((option) => {
			return option
				.setName("user")
				.setDescription(
					"The user that you would like to take action against",
				)
				.setRequired(true);
		})
		.addStringOption((option) => {
			return option
				.setName("reason")
				.setDescription(
					"The reason for muting them, defaults to standard in settings",
				);
		})
		.addStringOption((option) => {
			return option
				.setName("duration")
				.setDescription(
					"How long to mute the user for, will be permanent if no duration is specified",
				);
		}),
	async execute(interaction) {
		let punishmentsDB = new sqlite3.Database(
			"./Databases/punishments.db",
			sqlite3.OPEN_READWRITE,
			(err) => {
				if (err) return console.error(err.message);
			},
		);

		// Check muterole valid here

		const guild = interaction.guild;
		const target = interaction.options.getUser("user");

		const reason = interaction.options.getString("reason") ?? "None"; // get from settings
		const durationStr =
			interaction.options.getString("duration") ?? "Permanent";

		let duration, isPermanent, expiryDate;
		if (durationStr !== "Permanent") {
			duration = ms(durationStr);
			expiryDate = new Date(Date.now() + duration);
			isPermanent = false;

			if (duration === undefined)
				return interaction.reply({
					content:
						"There was an error parsing the duration (Example Formats: 60d, 5h, 20m, 1y)",
					ephemeral: true,
				});
		} else isPermanent = true;

		const q = "SELECT * FROM Mutes WHERE User = ? AND Guild = ?";
		punishmentsDB.get(q, [target.id, guild.id], async (err, row) => {
			if (err) {
				return console.error(err.message);
			}

			if (row) {
				punishmentsDB.close();
				return interaction.reply({
					content:
						"That person has already been muted, you can't mute them again!",
					ephemeral: true,
				});
			} else {
				const confirmEmbed = new EmbedBuilder()
					.setTitle("Confirm Mute")
					.setColor("Orange").setDescription(`
 **User:** ${target.globalName}
**Issued By:** ${interaction.user.globalName}
        
**Duration:** ${!isPermanent ? ms(duration, { long: true }) : "Permanent"}
**Expiration Date:** ${
					!isPermanent
						? `${expiryDate.getDate()}/${
								expiryDate.getMonth() + 1
						  }/${expiryDate.getFullYear()}`
						: "Never"
				}
**Reason:** ${reason}
                    `);

				const publicEmbed = new EmbedBuilder()
					.setTitle("User Muted")
					.setColor("Red").setDescription(`
**User:** ${target.globalName}
                           
**Duration:** ${!isPermanent ? ms(duration, { long: true }) : "Permanent"}
**Expiration Date:** ${
					!isPermanent
						? `${expiryDate.getDate()}/${
								expiryDate.getMonth() + 1
						  }/${expiryDate.getFullYear()}`
						: "Never"
				}
**Reason:** ${reason}
                   `);

				const actionRow = new ActionRowBuilder().addComponents(
					stylings.buttons.confirm,
					stylings.buttons.cancel,
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

					//Mutes if confirm button is pressed
					if (c.customId === "confirm") {
						// NTS give muterole here

						punishmentsDB.run(
							`INSERT INTO Mutes(Guild, User, IsPermanent, MutedUntil, Reason) VALUES(?,?,?,?,?)`,
							[
								guild.id,
								target.id,
								+isPermanent,
								!isPermanent ? expiryDate : null,
								reason,
							],
						);

						punishmentsDB.close();

						await c.channel.send({
							embeds: [publicEmbed],
							components: [],
							ephemeral: false,
						});
						await interaction.deleteReply();
					} else if (c.customId === "cancel") {
						await c.update({
							embeds: [buttons.embeds.cancelled],
							components: [],
						});
					}

					// Catches interaction failiure if no response is given
				} catch (e) {
					console.log(e);
					await interaction.editReply({
						content:
							"Confirmation not received within 1 minute, cancelling",
						components: [],
					});
				}
			}
		});
	},
};
