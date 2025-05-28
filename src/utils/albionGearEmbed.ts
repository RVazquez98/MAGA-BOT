import { EmbedBuilder, AttachmentBuilder } from "discord.js";
import { getAlbionItemIconUrl } from "../utils/albionIcon";
import { createCanvas, loadImage } from "canvas";
import fetch from "node-fetch";
import { getAlbionItemsPrice } from "../utils/albionItemPrice";

const PRICE_API = "https://www.albion-online-data.com/api/v2/stats/prices/";

export async function createGearEmbed({
  title,
  items,
  color = 0x0099ff,
  timeLabel,
  inventory = []
}: {
  title: string,
  items: any[],
  color?: number,
  timeLabel?: string,
  inventory?: any[]
}) {
  const iconSize = 64;
  const gearIconUrls = items.map(item => getAlbionItemIconUrl(item.Type));
  const inventoryIconUrls = inventory.filter(i => i && i.Type).map(item => getAlbionItemIconUrl(item.Type));
  const rowCount = inventoryIconUrls.length > 0 ? 2 : 1;
  const maxIcons = Math.max(gearIconUrls.length, inventoryIconUrls.length);
  const canvas = createCanvas(iconSize * maxIcons, iconSize * rowCount + (inventoryIconUrls.length > 0 ? 4 : 0));
  const ctx = canvas.getContext("2d");

  // Gear row
  for (let i = 0; i < gearIconUrls.length; i++) {
    const res = await fetch(gearIconUrls[i]);
    const buffer = Buffer.from(await res.arrayBuffer());
    const img = await loadImage(buffer);
    ctx.drawImage(img, i * iconSize, 0, iconSize, iconSize);
  }

  // Separator
  if (inventoryIconUrls.length > 0) {
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, iconSize + 2);
    ctx.lineTo(iconSize * maxIcons, iconSize + 2);
    ctx.stroke();
  }

  // Inventory row
  for (let i = 0; i < inventoryIconUrls.length; i++) {
    const res = await fetch(inventoryIconUrls[i]);
    const buffer = Buffer.from(await res.arrayBuffer());
    const img = await loadImage(buffer);
    ctx.drawImage(img, i * iconSize, iconSize + 4, iconSize, iconSize);
  }

  const buffer = canvas.toBuffer("image/png");
  const attachmentName = `gear_${(timeLabel || Date.now()).toString().replace(/[^a-zA-Z0-9]/g, "_")}.png`;
  const attachment = new AttachmentBuilder(buffer, { name: attachmentName });

  // --- Usa el utilitario para obtener precios considerando variantes de tier ---
  const gearPrice = await getAlbionItemsPrice(items);
  let description = "";
  for (const detail of gearPrice.details) {
    description += `**${detail.name}**: ${detail.price} silver\n`;
  }

  let inventoryDescription = "";
  let inventoryTotal = 0;
  if (inventory.length > 0) {
    const inventoryPrice = await getAlbionItemsPrice(inventory);
    inventoryTotal = inventoryPrice.total;
    for (const detail of inventoryPrice.details) {
      inventoryDescription += `**${detail.name}**: ${detail.price} silver\n`;
    }
  }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(
      `${description}\n**Total:** ${gearPrice.total} silver` +
      (inventoryDescription
        ? `\n\n**Inventory:**\n${inventoryDescription}\n**Total Inventory Value:** ${inventoryTotal} silver`
        : "")
    )
    .setImage(`attachment://${attachmentName}`)
    .setColor(color);

  return { embed, attachment };
}