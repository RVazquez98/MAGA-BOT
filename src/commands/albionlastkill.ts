import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder } from "discord.js";
import { fetchAPI } from "../utils/genericApi";
import { AlbionPlayerSearchResponse } from "../utils/IAlbion";
import { getAlbionItemIconUrl } from "../utils/albionIcon";
import { createCanvas, loadImage } from "canvas";
import fetch from "node-fetch";
import { createGearEmbed } from "../utils/albionGearEmbed";

const PRICE_API = "https://www.albion-online-data.com/api/v2/stats/prices/";

export const data = new SlashCommandBuilder()
  .setName("albionlastkill")
  .setDescription("Show your last kill: set, image, prices, and victim's inventory")
  .addStringOption(option =>
    option.setName("player")
      .setDescription("Albion Online player name")
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName("killnumber")
      .setDescription("Which kill to show? (1 = last, 2 = second last, etc.)")
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const player = interaction.options.getString("player", true);
  const killNumber = interaction.options.getInteger("killnumber") || 1;
  await interaction.deferReply();

  try {
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

    if (killNumber < 1 || killNumber > kills.length) {
      return interaction.editReply(`Invalid kill number. This player only has ${kills.length} kills.`);
    }

    const lastKill = kills[killNumber - 1];
    const killerEquipment = lastKill.Killer?.Equipment;
    const victim = lastKill.Victim;
    const victimEquipment = victim?.Equipment;
    const victimInventory = victim?.Inventory || [];

    if (!killerEquipment || !victimEquipment) {
      return interaction.editReply(`No equipment data found for last kill of "${player}".`);
    }

    // --- Killer set ---
    const slots = ["Head", "Armor", "Shoes", "MainHand", "OffHand", "Cape", "Mount"];
    const killerItems = slots
      .map(slot => killerEquipment[slot])
      .filter(item => item && item.Type);

    const { embed: killerEmbed, attachment: killerAttachment } = await createGearEmbed({
      title: `${player}'s last kill set`,
      items: killerItems,
      color: 0x00ff00,
      timeLabel: `Kill`
    });

    // --- Victim set + inventory ---
    const victimItems = slots
      .map(slot => victimEquipment[slot])
      .filter(item => item && item.Type);

    // Junta gear e inventario, y pasa el inventario como parámetro extra
    const { embed: victimEmbed, attachment: victimAttachment } = await createGearEmbed({
      title: `Victim: ${victim.Name}`,
      items: victimItems,
      color: 0xff9900,
      timeLabel: `Victim`,
      inventory: victimInventory ,

    });

    return interaction.editReply({
      embeds: [killerEmbed, victimEmbed],
      files: [killerAttachment, victimAttachment]
    });
  } catch (error: any) {
    return interaction.editReply(error.message || "An unexpected error occurred.");
  }
}