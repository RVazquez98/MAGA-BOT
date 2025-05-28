// Para la búsqueda de jugadores
export interface AlbionPlayerSearchResponse {
  players: {
    Id: string;
    Name: string;
    GuildId?: string;
    GuildName?: string;
    AllianceId?: string;
    AllianceName?: string;
    Avatar?: string;
    AvatarRing?: string;
    KillFame?: number;
    DeathFame?: number;
    FameRatio?: number;
  }[];
}

// Para el detalle del jugador y su equipo
export interface AlbionPlayerEquipmentResponse {
  Id: string;
  Name: string;
  GuildName?: string;
  AllianceName?: string;
  Equipment: {
    Head?: AlbionItem;
    Armor?: AlbionItem;
    Shoes?: AlbionItem;
    MainHand?: AlbionItem;
    OffHand?: AlbionItem;
    Bag?: AlbionItem;
    Cape?: AlbionItem;
    Mount?: AlbionItem;
    Potion?: AlbionItem;
    Food?: AlbionItem;
    [key: string]: AlbionItem | undefined;
  };
}

export interface AlbionItem {
  Type: string;
  Count: number;
  Quality: number;
  // Puedes agregar más campos si los necesitas
}// Para la búsqueda de jugadores
export interface AlbionPlayerSearchResponse {
  players: {
    Id: string;
    Name: string;
    GuildId?: string;
    GuildName?: string;
    AllianceId?: string;
    AllianceName?: string;
    Avatar?: string;
    AvatarRing?: string;
    KillFame?: number;
    DeathFame?: number;
    FameRatio?: number;
  }[];
}

// Para el detalle del jugador y su equipo
export interface AlbionPlayerEquipmentResponse {
  Id: string;
  Name: string;
  GuildName?: string;
  AllianceName?: string;
  Equipment: {
    Head?: AlbionItem;
    Armor?: AlbionItem;
    Shoes?: AlbionItem;
    MainHand?: AlbionItem;
    OffHand?: AlbionItem;
    Bag?: AlbionItem;
    Cape?: AlbionItem;
    Mount?: AlbionItem;
    Potion?: AlbionItem;
    Food?: AlbionItem;
    [key: string]: AlbionItem | undefined;
  };
}

export interface AlbionItem {
  Type: string;
  Count: number;
  Quality: number;
  // Puedes agregar más campos si los necesitas
}