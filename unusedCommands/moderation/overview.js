const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	SlashCommandBuilder,
	PermissionFlagsBits,
	EmbedBuilder,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("overwiew")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDescription(
			"Opens an overlay that displays the user's punishment history and actions to take against them.",
		)

		.addUserOption((option) => {
			return option
				.setName("user")
				.setDescription(
					"the user that you would like to take action against",
				)
				.setRequired(true);
		}),
	async execute(interaction) {
		// Buttons
		const banButton = new ButtonBuilder()
			.setCustomId("ban")
			.setLabel("Ban")
			.setStyle(ButtonStyle.Danger);

		const kickButton = new ButtonBuilder()
			.setCustomId("kick")
			.setLabel("Kick")
			.setStyle(ButtonStyle.Danger);

		const muteButton = new ButtonBuilder()
			.setCustomId("mute")
			.setLabel("Mute")
			.setStyle(ButtonStyle.Secondary);
		const tempMuteButton = new ButtonBuilder()
			.setCustomId("tempmute")
			.setLabel("Temporary Mute")
			.setStyle(ButtonStyle.Secondary);
		const timeoutButton = new ButtonBuilder()
			.setCustomId("timeout")
			.setLabel("Timeout")
			.setStyle(ButtonStyle.Secondary);
		const warnButton = new ButtonBuilder()
			.setCustomId("warn")
			.setLabel("Warn")
			.setStyle(ButtonStyle.Secondary);
		const linkButton = new ButtonBuilder()
			.setLabel("Inspect User")
			.setURL("https://google.com") // Placeholder for eventual dashboard
			.setDisabled(true)
			.setStyle(ButtonStyle.Link);
		z;
		const row = new ActionRowBuilder().addComponents(
			banButton,
			kickButton,
			muteButton,
			timeoutButton,
			linkButton,
		);

		////
		const guild = interaction.guild;
		const target = interaction.options.getUser("user");
		const guildTarget = await guild.members.fetch(target.id);
		console.log(guildTarget);

		console.log(target);
		const embed = new EmbedBuilder()
			.setTitle(guildTarget.nickname)
			.setColor("a83232").setDescription(`
Username: ${target.username}
Global Name: ${target.globalName}

User ID: ${target.id}
Joined Server: <t:${guildTarget.joinedTimestamp}>

Warnings: 0
Muted?: //Placeholder//
Timed Out?: //Placeholder//                                          

        
        `);

		await interaction.reply({
			embeds: [embed],
			components: [row],
			ephemeral: true,
		});
	},
};
