const { Events, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    const { cooldowns } = interaction.client;

    if (!command) {
      return console.error(
        `[ERR] No command matching ${interaction.commandName} found, something went wrong.`
      );
    }

    if (!cooldowns.has(command.data.name)) {
      cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now;
    const timestamps = cooldowns.get(command.data.name);
    const defaultCooldown = 0;

    const cooldownMs = (command.cooldown ?? defaultCooldown) * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expiration = timestamps.get(interaction.user.id) + cooldownMs;

      if (now < expiration) {
        return interaction.reply(
          "Sorry, you must wait before you can use this command again!"
        );
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownMs);

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.warn(error);
      if (interaction.replied | interaction.deferred) {
        await interaction.followUp({
          content:
            "There was an error when executing this command, if you believe this was a mistake, please contact Nebzla",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content:
            "There was an error when executing this command, if you believe this was a mistake, please contact Nebzla",
          ephemeral: true,
        });
      }
    }

    const commandsPath = path.join(path.join(__dirname, "../"), "commands");
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);

      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.log(
          `[WARN] The command from path ${filePath} is missing required "data" or "execute" properties`
        );
      }
    }
  },
};
