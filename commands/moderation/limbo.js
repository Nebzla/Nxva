const {
	ActionRowBuilder,
	SlashCommandBuilder,
	PermissionFlagsBits,
	EmbedBuilder,
} = require("discord.js");
const sqlite3 = require("sqlite3").verbose();
const stylings = require("../../stylings.js");
const settings = require("../utilities/settings.js");

// Change to limbo eventually

module.exports = {
	data: new SlashCommandBuilder()
		.setName("limbo")
		.setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
		.setDescription(
			"Puts a user in limbo, removing their roles until undone.",
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
					"The reason for putting them in limbo, defaults to standard in settings",
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

		const guild = interaction.guild;
		const target = interaction.options.getUser("user");
		const guildTarget = await guild.members.fetch(target.id);

		const defaultReason = await settings.GetDefaultReason(guild.id);
		const reason =
			interaction.options.getString("reason") ?? defaultReason ?? "None";

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

		let lostRoles = [];
		let lostRoleObjects = [];
		guildTarget.roles.cache.forEach((v, k) => {
			if (v.name !== "@everyone" && k !== roleId) {
				lostRoles.push(k);
				lostRoleObjects.push(v);
			}
		});

		const q = "SELECT * FROM Limbos WHERE Guild = ? AND User = ?";
		punishmentsDB.get(q, [guild.id, target.id], async (err, row) => {
			if (err) return console.error(err.message);

			if (row)
				return interaction.reply({
					content:
						"That user is already in limbo, did you mean to run /clearlimbo?",
					ephemeral: true,
				});
			else {
				//Not In Limbo
				const confirmEmbed = new EmbedBuilder()
					.setTitle("Confirm Limbo")
					.setColor("NotQuiteBlack").setDescription(`
**User:** ${target.globalName}
**Issued By:** ${interaction.user.globalName}

**Reason:** ${reason}
                    `);

				const publicEmbed = new EmbedBuilder()
					.setTitle("User Limbo'd")
					.setColor("DarkButNotBlack").setDescription(`
**User:** ${target.globalName}
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

					//Limbos if confirm button is pressed
					if (c.customId === "confirm") {
						punishmentsDB.run(
							"INSERT INTO Limbos(Guild,User,Reason,LostRoles) VALUES(?,?,?,?)",
							[
								guild.id,
								target.id,
								reason,
								JSON.stringify(lostRoles),
							],
						);
						punishmentsDB.close();

						guildTarget.roles.add(role);
						lostRoleObjects.forEach((r) => {
							try {
								guildTarget.roles.remove(r);
							} catch (e) {
								console.log(e);
							}
						});

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
