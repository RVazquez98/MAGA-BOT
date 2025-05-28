import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder } from "discord.js";
import { fetchAPI } from "../utils/genericApi";
import { AlbionPlayerSearchResponse } from "../utils/IAlbion";
import { getAlbionItemIconUrl } from "../utils/albionIcon";
import { createCanvas, loadImage } from "canvas";
import fetch from "node-fetch";

const PRICE_API = "https://www.albion-online-data.com/api/v2/stats/prices/";

export const data = new SlashCommandBuilder()
  .setName("albioneventdeaths")
  .setDescription("Get all deaths of a player in a big event near a given UTC date and time")
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
    const deaths = await fetchAPI(
      `https://gameinfo.albiononline.com/api/gameinfo/players/${playerId}/deaths`
    ) as any[];

    if (!deaths || deaths.length === 0) {
      return interaction.editReply(`No death history found for "${player}".`);
    }

    // Filtrar muertes en el rango de 3 horas a partir de la hora dada
    const threeHoursMs = 3 * 60 * 60 * 1000;
    const filtered = deaths.filter(death => {
      const deathTime = new Date(death.TimeStamp).getTime();
      const eventTimeMs = eventTime.getTime();
      return deathTime >= eventTimeMs && deathTime <= (eventTimeMs + threeHoursMs);
    });

    if (filtered.length === 0) {
      return interaction.editReply(`No deaths found for "${player}" in the 3 hours after the given time.`);
    }

    // Para cada muerte, crea un embed con fecha, equipo e imagen combinada
    const embeds = [];
    const files = [];
    for (const death of filtered) {
      const time = death.TimeStamp.replace("T", " ").replace("Z", " UTC");
      const equipment = death.Victim?.Equipment || {};

      // Slots a considerar (sin Bag, Potion, Food)
      const slots = ["Head", "Armor", "Shoes", "MainHand", "OffHand", "Cape", "Mount"];
      const items = slots
        .map(slot => equipment[slot])
        .filter(item => item && item.Type);

      // Imagen combinada de los ítems del jugador
      const iconUrls = items.map(item => getAlbionItemIconUrl(item.Type));
      const iconSize = 64;
      const canvas = createCanvas(iconSize * items.length, iconSize);
      const ctx = canvas.getContext("2d");

      for (let i = 0; i < iconUrls.length; i++) {
        const res = await fetch(iconUrls[i]);
        const buffer = await res.buffer();
        const img = await loadImage(buffer);
        ctx.drawImage(img, i * iconSize, 0, iconSize, iconSize);
      }

      const buffer = canvas.toBuffer("image/png");
      const attachmentName = `gear_${time.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
      const attachment = new AttachmentBuilder(buffer, { name: attachmentName });
      files.push(attachment);

      // Descripción con nombres y valores
      let total = 0;
      let description = "";
      for (const item of items) {
        const priceData = await fetchAPI(`${PRICE_API}${item.Type}.json`);
        let price = 0;
        if (Array.isArray(priceData) && priceData.length > 0) {
          price = priceData.reduce((min, p) =>
            p.sell_price_min > 0 && (min === 0 || p.sell_price_min < min)
              ? p.sell_price_min
              : min
          , 0);
        }
        total += price;
        const itemName = item.Type.replace(/_/g, " ");
        description += `**${itemName}**: ${price} silver\n`;
      }

      embeds.push(
        new EmbedBuilder()
          .setTitle(`Death at ${time}`)
          .setDescription(`${description}\n**Total:** ${total} silver`)
          .setImage(`attachment://${attachmentName}`)
          .setColor(0x0099ff)
      );
    }

    return interaction.editReply({ embeds, files });
  } catch (error: any) {
    return interaction.editReply(error.message || "An unexpected error occurred.");
  }
}