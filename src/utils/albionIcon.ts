/**
 * Devuelve la URL del ícono de un ítem de Albion Online.
 * @param itemType El ID del ítem, por ejemplo T8_HEAD_CLOTH_HELL@2
 */
export function getAlbionItemIconUrl(itemType: string): string {
  return `https://render.albiononline.com/v1/item/${itemType}.png`;
}