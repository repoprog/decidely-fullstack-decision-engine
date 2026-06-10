import { scalePresets } from "../data/scalePresets.js";
import { tableScenarios } from "../data/tableScenarios.js";

const DEFAULT_SCENARIO = tableScenarios.blank;
const DEFAULT_PRESET_KEY = "jakość / standard";

export const getInitialTableState = () => ({
  alternatives: [...(DEFAULT_SCENARIO.alternatives || [])],
  objectives: [...(DEFAULT_SCENARIO.objectives || [])],
  cells: { ...(DEFAULT_SCENARIO.cells || {}) },
  originalCells: {},
  objectiveUnits: { ...(DEFAULT_SCENARIO.objectiveUnits || {}) },
  sortDirections: { ...(DEFAULT_SCENARIO.sortDirections || {}) },

  showRanking: false,
  showTradeoffs: false,
  hideEqualizedObjectives: false,
  rejectedAlternatives: [],
  showRejected: false,

  activePreset: DEFAULT_PRESET_KEY,
  customScales: [...(scalePresets[DEFAULT_PRESET_KEY] || [])],

  isDirty: false,
  isLoading: false,
  isCalculating: false,
  backendWarnings: [],
  loadError: null,

  // Local revision used to ignore stale async backend responses.
  dataVersion: 0,
  backendAnalysisResult: null,

  currentProjectId: null,
  currentProjectVersion: null,
  isSaving: false,
  saveError: null,
  saveConflict: false,

  isPreviewMode: false,
  previewingSnapshotId: null,
});

export const parseSafely = (rawContent) => {
  if (typeof rawContent !== "string") {
    return rawContent;
  }

  try {
    return JSON.parse(rawContent);
  } catch {
    return null;
  }
};
