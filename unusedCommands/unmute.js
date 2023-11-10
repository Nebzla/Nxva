const {
	ActionRowBuilder,
	SlashCommandBuilder,
	PermissionFlagsBits,
	EmbedBuilder,
} = require("discord.js");
const sqlite3 = require("sqlite3").verbose();
const stylings = require("../stylings");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("unmute")
		.setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
		.setDescription(
			"Unmutes a user. Requires mute role to be setup in settings",
		)

		.addUserOption((option) => {
			return option
				.setName("user")
				.setDescription("The user that you would like to unmute")
				.setRequired(true);
		}),
	async execute(interaction) {
		const guild = interaction.guild;
		const target = interaction.options.getUser("user");
		const guildTarget = await guild.members.fetch(target.id);

		const actionRow = new ActionRowBuilder().addComponents(
			stylings.buttons.confirm,
			stylings.buttons.cancel,
		);

		let punishmentsDB = new sqlite3.Database(
			"./Databases/punishments.db",
			sqlite3.OPEN_READWRITE,
			(err) => {
				if (err) return console.error(err.message);
			},
		);

		const q = "SELECT * FROM Mutes WHERE User = ? AND Guild = ?";
		punishmentsDB.get(q, [target.id, guild.id], async (err, row) => {
			if (err) {
				return console.error(err.message);
			}

			if (!row) {
				punishmentsDB.close();
				return interaction.reply({
					content: "That person hasn't been muted!",
					ephemeral: true,
				});
			} else {
				console.log(row);
				const expiryDate = new Date(row.MutedUntil);

				const confirmEmbed = new EmbedBuilder()
					.setTitle("Confirm Unmute")
					.setColor("Green").setDescription(`
**User:** ${target.globalName}
        
**Expires On:** ${
					row.IsPermanent === 0
						? `${expiryDate.getDate()}/${
								expiryDate.getMonth() + 1
						  }/${expiryDate.getFullYear()}`
						: "Never"
				}
**Mute Reason:** ${row.Reason}
`);

				const publicEmbed = new EmbedBuilder()
					.setTitle("User Unmuted")
					.setColor("Green")
					.setDescription(`**User:** ${target.globalName}`);

				const resp = await interaction.reply({
					embeds: [confirmEmbed],
					components: [actionRow],
					ephemeral: true,
				});

				const collectFilter = (x) => x.user.id === interaction.user.id;
				try {
					const c = await resp.awaitMessageComponent({
						filter: collectFilter,
						time: 60_000,
					});

					// Listens for a button interaction from the user who ran the command
					if (c.customId === "confirm") {
						// NTS remove muterole here

						punishmentsDB.run(
							`DELETE FROM Mutes WHERE Guild = ? AND User = ?`,
							[guild.id, target.id],
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
							embeds: [stylings.embeds.cancelled],
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
