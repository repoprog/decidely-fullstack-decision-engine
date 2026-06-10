import { decisionApi } from "../../../api/decisionApi.js";
import { getApiErrorMessage } from "../../../api/apiError.js";
import { useToastStore } from "../../../store/useToastStore.js";
import { buildTableAnalysisPayload } from "../logic/tablePayloadBuilder.js";

const ANALYSIS_TIMEOUT_MS = 30_000;

const EQUALIZED_CRITERION_WARNING_PATTERN =
  /^Cel '(.+)' posiada identyczne wartości dla wszystkich aktywnych alternatyw, przez co nie wpływa na ranking\./;

const hasBlankName = (items) =>
  items.some((name) => !name || name.trim() === "");

const getEqualizedCriterionName = (warning) => {
  if (typeof warning !== "string") {
    return null;
  }

  const match = warning.match(EQUALIZED_CRITERION_WARNING_PATTERN);

  return match?.[1] || null;
};

const isEqualizedCriteriaWarning = (warning) =>
  getEqualizedCriterionName(warning) !== null;

const buildEqualizedCriteriaToastMessage = (warnings) => {
  const criterionNames = warnings
    .map(getEqualizedCriterionName)
    .filter(Boolean);

  if (criterionNames.length === 0) {
    return null;
  }

  if (criterionNames.length === 1) {
    return `Cel "${criterionNames[0]}" ma identyczne wartości dla wszystkich alternatyw i nie wpływa na ranking.`;
  }

  return `Wyrównane cele: ${criterionNames.join(", ")} nie wpływają na ranking.`;
};

export const createTableAnalysisActions = (set, get) => ({
  analyzeWithBackend: async () => {
    const state = get();
    const addToast = useToastStore.getState().addToast;

    if (state.isCalculating) {
      return;
    }

    const hasEmptyObjectives = hasBlankName(state.objectives);
    const hasEmptyAlternatives = hasBlankName(state.alternatives);

    if (hasEmptyObjectives || hasEmptyAlternatives) {
      addToast(
        "Uzupełnij wszystkie nazwy celów i alternatyw przed analizą serwerową.",
        "error",
      );
      return;
    }

    // Guards against stale backend responses overwriting newer local table changes.
    const localRevisionAtRequestStart = state.dataVersion;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

    set({
      isCalculating: true,
      backendWarnings: [],
    });

    try {
      const payload = buildTableAnalysisPayload(state);
      const result = await decisionApi.analyzeTable(payload, controller.signal);

      if (get().dataVersion !== localRevisionAtRequestStart) {
        return;
      }

      const warnings = result.warnings || [];
      const equalizedWarnings = warnings.filter(isEqualizedCriteriaWarning);
      const bannerWarnings = warnings.filter(
        (warning) => !isEqualizedCriteriaWarning(warning),
      );

      set({
        backendAnalysisResult: result,
        backendWarnings: bannerWarnings,
        isDirty: true,
      });

      const shouldShowEqualizedToast = state.showRanking || state.showTradeoffs;

      const equalizedToastMessage = shouldShowEqualizedToast
        ? buildEqualizedCriteriaToastMessage(equalizedWarnings)
        : null;

      if (equalizedToastMessage) {
        addToast(equalizedToastMessage, "info");
      }

      const winnerName =
        result.winnerIndex !== null && result.winnerIndex !== undefined
          ? state.alternatives[result.winnerIndex]
          : null;

      addToast(
        winnerName
          ? `Analiza serwera zakończona. Zwycięzca: ${winnerName}`
          : "Analiza serwera zakończona. Brak jednoznacznego zwycięzcy.",
        "success",
      );
    } catch (error) {
      set({
        backendAnalysisResult: null,
        backendWarnings: [],
      });

      const message =
        error.name === "CanceledError" || error.name === "AbortError"
          ? "Analiza przekroczyła limit czasu (30s). Powrócono do wyników lokalnych."
          : getApiErrorMessage(
              error,
              "Błąd weryfikacji serwera. Powrócono do wyników lokalnych.",
            );

      addToast(message, "error");
    } finally {
      clearTimeout(timeoutId);
      set({ isCalculating: false });
    }
  },
});
