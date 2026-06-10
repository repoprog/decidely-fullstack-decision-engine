import { scalePresets } from "../data/scalePresets";

export const createTableScaleActions = (set, withDirty) => ({
  loadPreset: (presetKey) =>
    set((state) => {
      const newPresetData = scalePresets[presetKey] || [];
      const allPresetWords = Object.values(scalePresets)
        .flat()
        .map((preset) => preset.word);

      const userAddedScales = state.customScales.filter(
        (scale) =>
          scale.isAdded === true || !allPresetWords.includes(scale.word),
      );

      const combined = [...newPresetData, ...userAddedScales];
      const uniqueMap = new Map();

      combined.forEach((item) => {
        uniqueMap.set(item.word, item);
      });

      return withDirty(state, {
        customScales: Array.from(uniqueMap.values()),
        activePreset: presetKey,
      });
    }),

  addScale: (word, rank) =>
    set((state) =>
      withDirty(state, {
        customScales: [
          ...state.customScales,
          {
            word,
            rank,
            isAdded: true,
          },
        ],
        activePreset: null,
      }),
    ),

  removeScale: (index) =>
    set((state) =>
      withDirty(state, {
        customScales: state.customScales.filter(
          (_, itemIndex) => itemIndex !== index,
        ),
        activePreset: null,
      }),
    ),

  clearScales: () =>
    set((state) =>
      withDirty(state, {
        customScales: [],
        activePreset: null,
      }),
    ),
});