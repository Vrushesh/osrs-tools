export type ArmourSetDefinition = {
  id: string;
  name: string;
  setItem: string;
  pieces: string[];
  members: boolean;
};

export const ARMOUR_SETS: ArmourSetDefinition[] = [
  {
    id: "ahrims",
    name: "Ahrim's armour set",
    setItem: "Ahrim's armour set",
    pieces: ["Ahrim's hood", "Ahrim's robetop", "Ahrim's robeskirt", "Ahrim's staff"],
    members: true,
  },
  {
    id: "dharoks",
    name: "Dharok's armour set",
    setItem: "Dharok's armour set",
    pieces: ["Dharok's helm", "Dharok's platebody", "Dharok's platelegs", "Dharok's greataxe"],
    members: true,
  },
  {
    id: "guthans",
    name: "Guthan's armour set",
    setItem: "Guthan's armour set",
    pieces: ["Guthan's helm", "Guthan's platebody", "Guthan's chainskirt", "Guthan's warspear"],
    members: true,
  },
  {
    id: "karils",
    name: "Karil's armour set",
    setItem: "Karil's armour set",
    pieces: ["Karil's coif", "Karil's leathertop", "Karil's leatherskirt", "Karil's crossbow"],
    members: true,
  },
  {
    id: "torags",
    name: "Torag's armour set",
    setItem: "Torag's armour set",
    pieces: ["Torag's helm", "Torag's platebody", "Torag's platelegs", "Torag's hammers"],
    members: true,
  },
  {
    id: "veracs",
    name: "Verac's armour set",
    setItem: "Verac's armour set",
    pieces: ["Verac's helm", "Verac's brassard", "Verac's plateskirt", "Verac's flail"],
    members: true,
  },
  {
    id: "rune-lg",
    name: "Rune armour set (lg)",
    setItem: "Rune armour set (lg)",
    pieces: ["Rune full helm", "Rune platebody", "Rune platelegs", "Rune kiteshield"],
    members: false,
  },
  {
    id: "rune-sk",
    name: "Rune armour set (sk)",
    setItem: "Rune armour set (sk)",
    pieces: ["Rune full helm", "Rune platebody", "Rune plateskirt", "Rune kiteshield"],
    members: false,
  },
  {
    id: "gilded-lg",
    name: "Gilded armour set (lg)",
    setItem: "Gilded armour set (lg)",
    pieces: ["Gilded full helm", "Gilded platebody", "Gilded platelegs", "Gilded kiteshield"],
    members: false,
  },
  {
    id: "gilded-sk",
    name: "Gilded armour set (sk)",
    setItem: "Gilded armour set (sk)",
    pieces: ["Gilded full helm", "Gilded platebody", "Gilded plateskirt", "Gilded kiteshield"],
    members: false,
  },
  {
    id: "guthix-lg",
    name: "Guthix armour set (lg)",
    setItem: "Guthix armour set (lg)",
    pieces: ["Guthix full helm", "Guthix platebody", "Guthix platelegs", "Guthix kiteshield"],
    members: false,
  },
  {
    id: "guthix-sk",
    name: "Guthix armour set (sk)",
    setItem: "Guthix armour set (sk)",
    pieces: ["Guthix full helm", "Guthix platebody", "Guthix plateskirt", "Guthix kiteshield"],
    members: false,
  },
  {
    id: "saradomin-lg",
    name: "Saradomin armour set (lg)",
    setItem: "Saradomin armour set (lg)",
    pieces: ["Saradomin full helm", "Saradomin platebody", "Saradomin platelegs", "Saradomin kiteshield"],
    members: false,
  },
  {
    id: "saradomin-sk",
    name: "Saradomin armour set (sk)",
    setItem: "Saradomin armour set (sk)",
    pieces: ["Saradomin full helm", "Saradomin platebody", "Saradomin plateskirt", "Saradomin kiteshield"],
    members: false,
  },
  {
    id: "zamorak-lg",
    name: "Zamorak armour set (lg)",
    setItem: "Zamorak armour set (lg)",
    pieces: ["Zamorak full helm", "Zamorak platebody", "Zamorak platelegs", "Zamorak kiteshield"],
    members: false,
  },
  {
    id: "zamorak-sk",
    name: "Zamorak armour set (sk)",
    setItem: "Zamorak armour set (sk)",
    pieces: ["Zamorak full helm", "Zamorak platebody", "Zamorak plateskirt", "Zamorak kiteshield"],
    members: false,
  },
];
