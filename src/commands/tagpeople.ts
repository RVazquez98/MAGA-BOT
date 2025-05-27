import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("tagpeople")
  .setDescription("Divide an amount among tagged users and generate !add-money commands")
  .addStringOption(option =>
    option.setName("users")
      .setDescription("Mention users or provide their IDs, separated by space")
      .setRequired(true)
  )
  .addNumberOption(option =>
    option.setName("amount")
      .setDescription("Amount to divide among users")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const input = interaction.options.getString("users", true);
  const amount = interaction.options.getNumber("amount", true);

  // Extract user mentions and IDs from the input
  const userIds = input.match(/<@!?(\d+)>|\d+/g);
  if (!userIds) {
    return interaction.reply("No valid users found.");
  }

  // Remove duplicates and format mentions
  const uniqueIds = [...new Set(userIds.map(id => id.replace(/[<@!>]/g, "")))];
  if (uniqueIds.length === 0) {
    return interaction.reply("No valid users found.");
  }

  const perPerson:number = amount / uniqueIds.length;
  const totalperPerson = perPerson.toFixed(0);

  // Send a separate message for each user
  for (let i = 0; i < uniqueIds.length; i++) {
    const message = `!add-money <@${uniqueIds[i]}> ${totalperPerson}`;
    if (i === 0) {
      await interaction.reply(message);
    } else {
      await interaction.followUp(message);
    }
  }
  await interaction.followUp(`Total amount of ${amount} divided among ${uniqueIds.length} users, each receiving ${totalperPerson}.`);
}

