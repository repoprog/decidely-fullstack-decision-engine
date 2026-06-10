import { scalePresets } from "../data/scalePresets.js";
import { SORT_DIRECTIONS } from "../../../constants/decisionTypes.js";
import { parseValue } from "../../../utils/numberParser.js";

const hasCellValue = (value) =>
  value !== undefined && value !== null && value.toString().trim() !== "";

const GLOBAL_SCALE_MAP = (() => {
  const map = {};

  Object.values(scalePresets).forEach((presetArray) => {
    presetArray.forEach(({ word, rank }) => {
      map[word.trim().toLowerCase()] = parseFloat(
        String(rank).replace(",", "."),
      );
    });
  });

  return map;
})();

// Resolution order matters: custom scales override presets, then numeric parsing is used as fallback.
export const resolveTableCellValue = (rawValue, customScales = []) => {
  if (!hasCellValue(rawValue)) {
    return null;
  }

  const normalized = rawValue.toString().replace(/−|\u2212/g, "-");
  const lower = normalized.trim().toLowerCase();

  const safeCustomScales = customScales.filter(
    (scale) => scale?.word && scale?.rank !== undefined && scale?.rank !== null,
  );

  for (const scale of safeCustomScales) {
    if (scale.word.trim().toLowerCase() === lower) {
      const parsed = parseFloat(String(scale.rank).replace(",", "."));
      return Number.isNaN(parsed) ? null : parsed;
    }
  }

  if (lower in GLOBAL_SCALE_MAP) {
    return GLOBAL_SCALE_MAP[lower];
  }

  const cleanStrForCheck = normalized.replace(/[^\d.,-]/g, "");
  if (cleanStrForCheck === "" || cleanStrForCheck === "-") return null;

  const parsedNum = parseValue(normalized);
  return Number.isNaN(parsedNum) ? null : parsedNum;
};

export function buildTableAnalysisPayload(store) {
  const {
    alternatives,
    objectives,
    cells,
    sortDirections,
    customScales,
    rejectedAlternatives,
  } = store;

  const completelyEmptyAlts = alternatives
    .map((_, alternativeIndex) => alternativeIndex)
    .filter(
      (alternativeIndex) =>
        !objectives.some((_, objectiveIndex) =>
          hasCellValue(cells[`${objectiveIndex}-${alternativeIndex}`]),
        ),
    );

  const combinedRejected = [
    ...new Set([...rejectedAlternatives, ...completelyEmptyAlts]),
  ];

  const resolvedMatrix = {};

  for (let rowIndex = 0; rowIndex < objectives.length; rowIndex++) {
    for (let colIndex = 0; colIndex < alternatives.length; colIndex++) {
      const resolved = resolveTableCellValue(
        cells[`${rowIndex}-${colIndex}`],
        customScales,
      );

      if (resolved !== null) {
        resolvedMatrix[`${rowIndex}-${colIndex}`] = resolved;
      }
    }
  }

  return {
    alternatives: alternatives.map((name, index) => ({ index, name })),
    criteria: objectives.map((name, index) => ({
      index,
      name,
      // Backend DTO validates uppercase values: HIGHER | LOWER.
      sortDirection: String(
        sortDirections[index] || SORT_DIRECTIONS.HIGHER,
      ).toUpperCase(),
    })),
    resolvedMatrix,
    rejectedAlternativeIndices: combinedRejected,
    // Backend is the source of truth for detecting equalized criteria.
    equalizedCriterionIndices: [],
  };
}

export function buildTableSavePayload(state) {
  return {
    version: state.currentProjectVersion ?? null,
    content: {
      alternatives: state.alternatives,
      objectives: state.objectives,
      cells: state.cells,
      originalCells: state.originalCells,
      objectiveUnits: state.objectiveUnits,
      sortDirections: state.sortDirections,
      customScales: state.customScales,
      activePreset: state.activePreset,
      rejectedAlternatives: state.rejectedAlternatives,
      showRejected: state.showRejected,
      showRanking: state.showRanking,
      showTradeoffs: state.showTradeoffs,
      hideEqualizedObjectives: state.hideEqualizedObjectives,
    },
  };
}
