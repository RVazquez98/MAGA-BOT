import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { fetchAPI } from "../utils/genericApi";
import { AlbionPlayerSearchResponse } from "../utils/IAlbion";
import { createGearEmbed } from "../utils/albionGearEmbed";

export const data = new SlashCommandBuilder()
  .setName("albioneventkills")
  .setDescription("Get all kills made by a player in a period of 3 hours from a given UTC date and time")
  .addStringOption(option =>
    option.setName("player")
      .setDescription("Albion Online player name")
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("date")
      .setDescription("Event date (YYYY-MM-DD, UTC)")
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("time")
      .setDescription("Event time (HH:mm, 24h UTC, e.g. 18:30)")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const player = interaction.options.getString("player", true);
  const dateStr = interaction.options.getString("date", true);
  const timeStr = interaction.options.getString("time", true);

  await interaction.deferReply();

  try {
    const eventTimeStr = `${dateStr}T${timeStr}:00Z`;
    const eventTime = new Date(eventTimeStr);
    if (isNaN(eventTime.getTime())) {
      return interaction.editReply("Invalid date or time format. Example: date=2024-05-28 time=18:30");
    }

    const data = await fetchAPI(
      `https://gameinfo.albiononline.com/api/gameinfo/search?q=${encodeURIComponent(player)}`
    ) as AlbionPlayerSearchResponse;

    if (!data.players || data.players.length === 0) {
      return interaction.editReply(`Player "${player}" not found.`);
    }

    const playerId = data.players[0].Id;
    const kills = await fetchAPI(
      `https://gameinfo.albiononline.com/api/gameinfo/players/${playerId}/kills`
    ) as any[];

    if (!kills || kills.length === 0) {
      return interaction.editReply(`No kill history found for "${player}".`);
    }

    // Filtrar kills en el rango de 3 horas a partir de la hora dada
    const threeHoursMs = 3 * 60 * 60 * 1000;
    const filtered = kills.filter(kill => {
      const killTime = new Date(kill.TimeStamp).getTime();
      const eventTimeMs = eventTime.getTime();
      return killTime >= eventTimeMs && killTime <= (eventTimeMs + threeHoursMs);
    });

    if (filtered.length === 0) {
      return interaction.editReply(`No kills found for "${player}" in the 3 hours after the given time.`);
    }

    // Para cada kill, crea un embed con equipo del killer y víctima, fecha, participantes
    const embeds = [];
    const files = [];
    const slots = ["Head", "Armor", "Shoes", "MainHand", "OffHand", "Cape", "Mount"];

    for (const kill of filtered) {
      const time = kill.TimeStamp;   

      // Victim
      const victim = kill.Victim;
      const victimEquipment = victim?.Equipment || {};
      const victimInventory = victim?.Inventory || [];
      const victimItems = slots
        .map(slot => victimEquipment[slot])
        .filter(item => item && item.Type);

      const { embed: victimEmbed, attachment: victimAttachment } = await createGearEmbed({
        title: `Victim: ${victim?.Name || "Unknown"}`,
        items: victimItems,
        color: 0xff9900,
        timeLabel: time,
        inventory: victimInventory,
      });

      embeds.push(victimEmbed);
      files.push(victimAttachment);
    }

    return interaction.editReply({ embeds, files });
  } catch (error: any) {
    return interaction.editReply(error.message || "An unexpected error occurred.");
  }
}