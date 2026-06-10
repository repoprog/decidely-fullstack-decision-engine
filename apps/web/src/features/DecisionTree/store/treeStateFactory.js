import { EVALUATION_MODES } from "../../../constants/decisionTypes.js";
import { treeScenarios } from "../data/treeScenarios.js";
import {
  getLayoutedElements,
  renumberDecisionAndChanceNodes,
  syncColumnLabels,
} from "../logic/treeUtils.js";
import { evaluateAndSetWinningPath } from "../logic/treeAlgorithms.js";

const defaultScenario = treeScenarios.blank || {
  nodes: [],
  edges: [],
  labels: [],
};

const sanitizeEdges = (edges = []) =>
  edges.map((edge) => ({
    ...edge,
    type: "smartChoices",
  }));

export const createLayoutedTreeState = (
  state,
  nodes,
  edges,
  labels = [],
  {
    evaluationMode = state.evaluationMode,
    isDirty = state.isDirty,
    clearProjectId = false,
  } = {},
) => {
  const sanitizedEdges = sanitizeEdges(edges);

  const renumberedNodes = renumberDecisionAndChanceNodes(
    nodes,
    sanitizedEdges,
  );

  const layoutedNodes = getLayoutedElements(renumberedNodes, sanitizedEdges);

  const stageColumnLabels = syncColumnLabels(
    layoutedNodes,
    sanitizedEdges,
    labels,
  );

  const nextState = {
    ...state,
    nodes: layoutedNodes,
    edges: sanitizedEdges,
    stageColumnLabels,
    evaluationMode,
    isDirty,
    dataVersion: state.dataVersion + 1,
    ...(clearProjectId && {
      currentProjectId: null,
      currentProjectVersion: null,
    }),
  };

  return evaluateAndSetWinningPath(nextState);
};

export const createBlankTreeState = (state) =>
  createLayoutedTreeState(
    state,
    treeScenarios.blank.nodes,
    treeScenarios.blank.edges,
    treeScenarios.blank.labels || [],
    {
      evaluationMode: EVALUATION_MODES.MAX,
      isDirty: false,
      clearProjectId: true,
    },
  );

export const parseProjectContent = (rawContent) => {
  if (typeof rawContent !== "string") {
    return rawContent || {};
  }

  try {
    return JSON.parse(rawContent);
  } catch {
    return {};
  }
};

export const getInitialTreeState = () => {
  const initialState = {
    nodes: [],
    edges: [],
    stageColumnLabels: [],
    evaluationMode: EVALUATION_MODES.MAX,
    evaluationMap: {},
    winningPath: [],
    dataVersion: 0,

    isDirty: false,
    isLoading: false,
    isSimulationMode: false,
    isCalculating: false,
    backendWarnings: [],

    currentProjectId: null,
    currentProjectVersion: null,
    isSaving: false,
    saveError: null,
    saveConflict: false,
    loadError: null,

    isPreviewMode: false,
    previewingSnapshotId: null,
  };

  return createLayoutedTreeState(
    initialState,
    defaultScenario.nodes,
    defaultScenario.edges,
    defaultScenario.labels || [],
    {
      evaluationMode: EVALUATION_MODES.MAX,
      isDirty: false,
    },
  );
};