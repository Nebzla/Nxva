const {
	ActionRowBuilder,
	SlashCommandBuilder,
	PermissionFlagsBits,
	EmbedBuilder,
} = require("discord.js");
const sqlite3 = require("sqlite3").verbose();
const stylings = require("../../stylings.js");
const settings = require("../utilities/settings.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("clearlimbo")
		.setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
		.setDescription(
			"Take a user out of limbo, granting back any roles lost. Requires limbo role to be setup in settings"
		)

		.addUserOption((option) => {
			return option
				.setName("user")
				.setDescription(
					"The user that you would like to take action against"
				)
				.setRequired(true);
		}),
	async execute(interaction) {
		let punishmentsDB = new sqlite3.Database(
			"./Databases/punishments.db",
			sqlite3.OPEN_READWRITE,
			(err) => {
				if (err) return console.error(err.message);
			}
		);

		const guild = interaction.guild;
		const target = interaction.options.getUser("user");
		const guildTarget = await guild.members.fetch(target.id);

		const roleId = await settings.GetLimboRoleId(guild.id);
		if (!roleId)
			return interaction.reply({
				content: "You haven't setup a limbo role",
				ephemeral: true,
			});

		const role = guild.roles.cache.get(roleId);
		if (!role)
			return interaction.reply({
				content:
					"The role you previously used no longer exists, please reset it and try again.",
				ephemeral: true,
			});

		const q = "SELECT * FROM Limbos WHERE Guild = ? AND User = ?";
		punishmentsDB.get(q, [guild.id, target.id], async (err, row) => {
			if (err) return console.error(err.message);

			if (!row)
				return interaction.reply({
					content:
						"The person you are trying to free from limbo isn't in it!",
					ephemeral: true,
				});
			else {
				const confirmEmbed = new EmbedBuilder()
					.setTitle("Confirm Free From Limbo")
					.setColor("Green").setDescription(`
**User:** ${target.globalName}
**Issued By:** ${interaction.user.globalName}
                    `);

				const publicEmbed = new EmbedBuilder()
					.setTitle("User Freed From Limbo")
					.setColor("Green").setDescription(`
**User:** ${target.globalName}
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

					//Limbos if confirm button is pressed
					if (c.customId === "confirm") {
						punishmentsDB.run(
							"DELETE FROM Limbos WHERE Guild = ? AND User = ?",
							[guild.id, target.id]
						);
						punishmentsDB.close();

						const oldRoles = JSON.parse(row.LostRoles);
						guildTarget.roles.remove(role).catch(() => {
							return interaction.reply(
								"An error occured, please ensure my role is above those you wish to manage in the hierarchy"
							);
						});

						oldRoles.forEach((rId) => {
							guildTarget.roles.add(rId).catch((e) => {
								console.warn(e);
							});
						});

						await c.channel.send({
							embeds: [publicEmbed],
							components: [],
							ephemeral: false,
						});

						await interaction.deleteReply();
					} else if (c.customId === "cancel") {
						await c.update({
							embeds: [settings.embeds.cancelled],
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
