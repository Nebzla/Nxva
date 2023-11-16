const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const DatabaseManager = require("../../Databases/databaseManager.js");
const { CreateBalance } = require("../utilities/settings.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("setupbalances")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.setDescription(
			"Gives any users a balance who dont already posses one"
		),
        async execute(interaction) {
            const economyDB = DatabaseManager.InitialiseDatabase("economy.db");
            const q = "SELECT * FROM Balance WHERE Guild = ? AND User = ?"

            const guild = interaction.guild;
            const members = await guild.members.fetch();
            if(members)
            members.forEach(member => {
                const row = economyDB.RunValues(q, [guild.id, member.id]);
                if(!row) CreateBalance(guild.id, member.id);
            });

            return interaction.reply("I've given each user the default balance.");
        }
    }