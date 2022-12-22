const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  async execute(interaction) {
    await interaction.reply({
      content: "Pinging...",
      fetchReply: true,
    });
    await interaction.editReply(`Pong! ${interaction.client.ws.ping}ms.`);
  },
};
