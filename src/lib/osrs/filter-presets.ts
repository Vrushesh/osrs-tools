export type FilterPresetId = "useful" | "bulk" | "f2p" | "margin";

export type FilterPresetValues = {
  includeMembers: boolean;
  hideStale: boolean;
  minLimit: string;
  minVolume: string;
  minProfit: string;
  minRoi: string;
  maxProfit: string;
};

export type FilterPreset = {
  id: FilterPresetId;
  label: string;
  description: string;
  values: FilterPresetValues;
};

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: "useful",
    label: "Useful",
    description: "Fresh profitable trades with basic volume.",
    values: {
      includeMembers: true,
      hideStale: true,
      minLimit: "",
      minVolume: "5",
      minProfit: "1",
      minRoi: "",
      maxProfit: "",
    },
  },
  {
    id: "bulk",
    label: "Bulk",
    description: "Higher GE limits and stronger recent volume.",
    values: {
      includeMembers: true,
      hideStale: true,
      minLimit: "70",
      minVolume: "25",
      minProfit: "100",
      minRoi: "",
      maxProfit: "",
    },
  },
  {
    id: "f2p",
    label: "F2P",
    description: "Free-to-play items with fresh profitable trades.",
    values: {
      includeMembers: false,
      hideStale: true,
      minLimit: "",
      minVolume: "5",
      minProfit: "1",
      minRoi: "",
      maxProfit: "",
    },
  },
  {
    id: "margin",
    label: "Margin",
    description: "Larger per-item profit while keeping recent volume.",
    values: {
      includeMembers: true,
      hideStale: true,
      minLimit: "",
      minVolume: "5",
      minProfit: "500",
      minRoi: "",
      maxProfit: "",
    },
  },
];

export function getFilterPresetValues(id: FilterPresetId) {
  const preset = FILTER_PRESETS.find((entry) => entry.id === id);
  return preset?.values ?? FILTER_PRESETS[0].values;
}
