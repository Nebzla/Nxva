const {
	Events,
	EmbedBuilder,
} = require("discord.js");

module.exports = {
	name: Events.GuildCreate,
	async execute(g) {
		function FindWelcomeChannel() {
			let c;
			g.channels.cache.forEach((v) => {
				if (v.type == 0) c = v;
			});
			return c;
		}

		const welcomeMessageChannel = FindWelcomeChannel();
		if (!welcomeMessageChannel) return;

		const welcomeEmbed = new EmbedBuilder()
			.setTitle("Thank you for inviting me!")
			.setColor("Aqua")
			.setDescription(`Hi, I'm Nxva, a multi-purpose Discord in early stages of development built by Nebzla. I've been designed to do a wide range of tasks, such as moderation, games, utilities, etc.


For now, you can configure my various with the **/settings** slash command, however it is planned to improve this
in the future with a setup command on joining. I hope you enjoy using the bot, and thanks for inviting me to your server :)`);

		welcomeMessageChannel.send({ embeds: [welcomeEmbed] });
	},
};
