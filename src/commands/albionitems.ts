import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder } from "discord.js";
import { fetchAPI } from "../utils/genericApi";
import { AlbionPlayerSearchResponse } from "../utils/IAlbion";
import { getAlbionItemIconUrl } from "../utils/albionIcon";
import { createCanvas, loadImage } from "canvas";
import fetch from "node-fetch";
import { createGearEmbed } from "../utils/albionGearEmbed";

const PRICE_API = "https://www.albion-online-data.com/api/v2/stats/prices/";

export const data = new SlashCommandBuilder()
  .setName("albionitems")
  .setDescription("Get the total price of equipped gear (excluding bag, potion, food) at last death")
  .addStringOption(option =>
    option.setName("player")
      .setDescription("Albion Online player name")
      .setRequired(true)
  )
  .addBooleanOption(option =>
    option.setName("showkiller")
      .setDescription("Show the killer's gear too?")
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const player = interaction.options.getString("player", true);
  const showKiller = interaction.options.getBoolean("showkiller") || false;
  await interaction.deferReply();

  try {
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

    const lastDeath = deaths[0];
    const equipment = lastDeath.Victim?.Equipment;
    if (!equipment) {
      return interaction.editReply(`No equipment data found for last death of "${player}".`);
    }

    // Slots a considerar (sin Bag, Potion, Food)
    const slots = ["Head", "Armor", "Shoes", "MainHand", "OffHand", "Cape", "Mount"];
    const items = slots
      .map(slot => equipment[slot])
      .filter(item => item && item.Type);

    if (items.length === 0) {
      return interaction.editReply(`"${player}" had no gear equipped at last death.`);
    }

    // --- Imagen combinada de los ítems del jugador ---
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
    const attachment = new AttachmentBuilder(buffer, { name: "gear.png" });

    // --- Descripción con nombres y valores ---
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

    const { embed, attachment: gearAttachment } = await createGearEmbed({
      title: `${player}'s last death gear`,
      items,
      color: 0x0099ff,
      timeLabel: `Death at ${new Date(lastDeath.Time).toLocaleString()}`
    });

    const embeds = [embed];
    const files = [gearAttachment];

    // --- Killer info ---
    if (showKiller && lastDeath.Killer && lastDeath.Killer.Equipment) {
      const killerName = lastDeath.Killer.Name || "Unknown Killer";
      const killerEquipment = lastDeath.Killer.Equipment;
      const killerItems = slots
        .map(slot => killerEquipment[slot])
        .filter(item => item && item.Type);

      const { embed: killerEmbed, attachment: killerAttachment } = await createGearEmbed({
        title: `${killerName}'s gear`,
        items: killerItems,
        color: 0xff0000,
        timeLabel: `Killer at ${new Date(lastDeath.Time).toLocaleString()}`
      });

      embeds.push(killerEmbed);
      files.push(killerAttachment);
    }

    return interaction.editReply({ embeds, files });
  } catch (error: any) {
    return interaction.editReply(error.message || "An unexpected error occurred.");
  }
}