const PRICE_API = "https://www.albion-online-data.com/api/v2/stats/prices/";

function getEquivalentItemTypes(type: string): string[] {
  // Ejemplo: T5_MAIN_SWORD@3
  const match = type.match(/T(\d)_([A-Z0-9_]+)(@(\d))?/);
  if (!match) return [type];

  const baseName = match[2];
  const equivalents: string[] = [];
  for (let tier = 4; tier <= 8; tier++) {
    for (let enchant = 0; enchant <= 4; enchant++) {
      equivalents.push(`T${tier}_${baseName}${enchant > 0 ? `@${enchant}` : ""}`);
    }
  }
  return equivalents;
}

export async function getAlbionItemBestPrice(type: string): Promise<number> {
  const equivalents = getEquivalentItemTypes(type);
  let minPrice = 0;

  for (const eqType of equivalents) {
    const res = await fetch(`${PRICE_API}${eqType}.json`);
    let priceData;
    try {
      priceData = await res.json();
    } catch (e) {
      // Si la respuesta no es JSON, probablemente es un throttle
      return 0;
    }
    if (Array.isArray(priceData)) {
      for (const entry of priceData) {
        if (entry.sell_price_min > 0 && (minPrice === 0 || entry.sell_price_min < minPrice)) {
          minPrice = entry.sell_price_min;
        }
      }
    }
    // Opcional: espera un poco para evitar throttle
    await new Promise(r => setTimeout(r, 100));
  }
  return minPrice;
}

export async function getAlbionItemsPrice(items: any[]): Promise<{
  total: number,
  details: { name: string, price: number, type: string }[]
}> {
  let total = 0;
  const details = [];

  for (const item of items) {
    if (!item || !item.Type) continue;
    const price = await getAlbionItemBestPrice(item.Type);
    total += price;
    details.push({
      name: item.Type.replace(/_/g, " "),
      price,
      type: item.Type
    });
  }

  return { total, details };
}