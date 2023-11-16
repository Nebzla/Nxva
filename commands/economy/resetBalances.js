const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, PermissionFlagsBits } = require("discord.js");
const settings = require("../../commands/utilities/settings.js");
const stylings = require("../../stylings");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("resetbalances")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDescription("Resets every server members balance, THIS ACTION IS IRREVERSABLE"),

	async execute(interaction) {


        const confirmEmbed = new EmbedBuilder()
        .setTitle("Confirm Database Reset")
        .setColor("Red")
        .setDescription("You are about to reset every users' balance to the default, are you sure?");
        const actionCompleteEmbed = new EmbedBuilder()
        .setTitle("Balance Database Wiped")
        .setColor("DarkButNotBlack");

        const actionRow = new ActionRowBuilder().addComponents(
			stylings.buttons.confirm,
			stylings.buttons.cancel,
		);

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

			if (c.customId === "confirm") {

                const guild = interaction.guild;
                const members = await guild.members.fetch();
                members.forEach(member => {
                    settings.ResetBalance(guild.id, member.id);
                });

                await c.update({
                    embeds: [actionCompleteEmbed],
                    components: [],
                });



			} else if (c.customId === "cancel") {
				await c.update({
					embeds: [stylings.embeds.cancelled],
					components: [],
				});
			}

			// Catches interaction failiure if no response is given
		} catch (e) {
			await interaction.editReply({
				content: "The interaction timed out.",
				embeds: [],
				components: [],
			});
		}




    }
};