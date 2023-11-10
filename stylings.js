const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} = require("discord.js");

module.exports = {
	buttons: {
		confirm: new ButtonBuilder()
			.setCustomId("confirm")
			.setLabel("Confirm")
			.setStyle(ButtonStyle.Success),

		cancel: new ButtonBuilder()
			.setCustomId("cancel")
			.setLabel("Cancel")
			.setStyle(ButtonStyle.Danger),
	},

	embeds: {
		cancelled: new EmbedBuilder().setTitle("Cancelled").setColor("Grey"),
	},
};
