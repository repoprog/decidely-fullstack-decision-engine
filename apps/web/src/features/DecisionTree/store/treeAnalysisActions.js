import { decisionApi } from "../../../api/decisionApi.js";
import { getApiErrorMessage } from "../../../api/apiError.js";
import { useToastStore } from "../../../store/useToastStore.js";
import { buildTreeAnalysisPayload } from "../logic/treePayloadBuilder.js";

const ANALYSIS_TIMEOUT_MS = 30_000;

const mapBackendWarningsToHumanLabels = (warnings, nodes) =>
  warnings.map((warning) =>
    warning.replace(/'(c\d+|d\d+|t\d+)'/g, (match, nodeId) => {
      const node = nodes.find((item) => item.id === nodeId);

      if (node?.data?.nodeNumber) {
        return `nr ${node.data.nodeNumber}`;
      }

      return match;
    }),
  );

const applyBackendEvaluationToNodes = (nodes, evaluationMap = {}) =>
  nodes.map((node) => {
    const backendEval = evaluationMap[node.id];

    if (!backendEval) {
      return node;
    }

    return {
      ...node,
      data: {
        ...node.data,
        expectedValue: backendEval.emv,
        equation: backendEval.equation ?? node.data.equation,
      },
    };
  });

export const createTreeAnalysisActions = (set, get) => ({
  analyzeWithBackend: async () => {
    const state = get();

    if (state.isCalculating) {
      return;
    }

    const localRevisionAtRequestStart = state.dataVersion;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

    set({
      isCalculating: true,
      backendWarnings: [],
    });

    try {
      const payload = buildTreeAnalysisPayload(
        state.nodes,
        state.edges,
        state.evaluationMode,
      );

      const result = await decisionApi.analyzeTree(payload, controller.signal);

      if (get().dataVersion !== localRevisionAtRequestStart) {
        return;
      }

      const updatedNodes = applyBackendEvaluationToNodes(
        state.nodes,
        result.evaluationMap,
      );

      const warnings = result.warnings || [];
      const hasWarnings = warnings.length > 0;
      const humanFriendlyWarnings = mapBackendWarningsToHumanLabels(
        warnings,
        updatedNodes,
      );

      set((currentState) => ({
        nodes: updatedNodes,
        evaluationMap: hasWarnings ? {} : result.evaluationMap || {},
        winningPath: hasWarnings ? [] : result.winningPath || [],
        backendWarnings: humanFriendlyWarnings,
        isDirty: true,
        dataVersion: currentState.dataVersion + 1,
      }));

      if (!hasWarnings) {
        useToastStore
          .getState()
          .addToast(
            "Analiza serwera zakończona. Ścieżka optymalna zaktualizowana.",
            "success",
          );
      }
    } catch (error) {
      const message =
        error.name === "CanceledError" || error.name === "AbortError"
          ? "Analiza przekroczyła limit czasu (30s)."
          : getApiErrorMessage(
              error,
              "Błąd weryfikacji serwera. Wyniki lokalne pozostają aktywne.",
            );

      useToastStore.getState().addToast(message, "error");
    } finally {
      clearTimeout(timeoutId);
      set({ isCalculating: false });
    }
  },
});