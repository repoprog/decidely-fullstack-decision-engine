import { scalePresets } from "../data/scalePresets";
import {
  SORT_DIRECTIONS,
  DOMINATION_TYPES,
} from "../../../constants/decisionTypes";

const hasCellValue = (value) =>
  value !== undefined && value !== null && value.toString().trim() !== "";

const getActiveAlternativeIndexes = (
  alternatives = [],
  rejectedAlternatives = [],
) =>
  alternatives
    .map((_, index) => index)
    .filter((index) => !rejectedAlternatives.includes(index));

const getNonEmptyActiveAlternativeIndexes = (
  alternatives = [],
  rejectedAlternatives = [],
  objectives = [],
  cells = {},
) =>
  getActiveAlternativeIndexes(alternatives, rejectedAlternatives).filter(
    (alternativeIndex) =>
      objectives.some((_, objectiveIndex) =>
        hasCellValue(cells[`${objectiveIndex}-${alternativeIndex}`]),
      ),
  );

const GLOBAL_SCALE_MAP = (() => {
  const map = {};

  Object.values(scalePresets).forEach((presetArray) => {
    presetArray.forEach((item) => {
      if (item?.word && item?.rank !== undefined && item?.rank !== null) {
        const parsedRank = Number(String(item.rank).replace(",", "."));

        if (!Number.isNaN(parsedRank)) {
          map[item.word.trim().toLowerCase()] = parsedRank;
        }
      }
    });
  });

  return map;
})();

const buildCustomScaleMap = (customScales = []) =>
  Object.fromEntries(
    customScales
      .filter(
        (scale) =>
          scale?.word && scale?.rank !== undefined && scale?.rank !== null,
      )
      .map((scale) => [
        scale.word.trim().toLowerCase(),
        Number(String(scale.rank).replace(",", ".")),
      ])
      .filter(([, rank]) => !Number.isNaN(rank)),
  );

const resolveComparableValue = (value, unit = "", customScaleMap = {}) => {
  if (!hasCellValue(value)) {
    return null;
  }

  const rawText = value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/−|\u2212/g, "-");

  if (rawText in customScaleMap) {
    return `number:${customScaleMap[rawText]}`;
  }

  if (rawText in GLOBAL_SCALE_MAP) {
    return `number:${GLOBAL_SCALE_MAP[rawText]}`;
  }

  let normalized = rawText.replace(/\s/g, "").replace(",", ".");

  const normalizedUnit = unit
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s/g, "");

  if (normalizedUnit) {
    normalized = normalized.split(normalizedUnit).join("");
  }

  const match = normalized.match(/-?\d+(?:\.\d+)?/);

  if (match) {
    return `number:${Number(match[0])}`;
  }

  return `text:${normalized}`;
};

// Tradeoff elimination: equalized objectives can be hidden once active, non-empty alternatives share the same resolved value.
export const checkIsRowEqualized = (rowIndex, state) => {
  const {
    showTradeoffs,
    showRanking,
    alternatives = [],
    objectives = [],
    rejectedAlternatives = [],
    cells = {},
    objectiveUnits = {},
    customScales = [],
  } = state;

  if (!showTradeoffs && !showRanking) return false;

  const activeAlts = getNonEmptyActiveAlternativeIndexes(
    alternatives,
    rejectedAlternatives,
    objectives,
    cells,
  );

  if (activeAlts.length <= 1) return false;

  const unit = objectiveUnits[rowIndex] || "";
  const customScaleMap = buildCustomScaleMap(customScales);

  let firstValue = null;

  for (const alternativeIndex of activeAlts) {
    const value = resolveComparableValue(
      cells[`${rowIndex}-${alternativeIndex}`],
      unit,
      customScaleMap,
    );

    if (value === null) {
      return false;
    }

    if (firstValue === null) {
      firstValue = value;
    } else if (firstValue !== value) {
      return false;
    }
  }

  return true;
};

export const getEqualizedRowsIndexes = (state) => {
  return state.objectives
    .map((_, objectiveIndex) => objectiveIndex)
    .filter((objectiveIndex) => checkIsRowEqualized(objectiveIndex, state));
};

// Converts mixed text/numeric cell values into comparable ranks.
export const getRowRanks = (rowIndex, state) => {
  const {
    alternatives = [],
    rejectedAlternatives = [],
    cells = {},
    customScales = [],
    sortDirections = {},
    objectiveUnits = {},
  } = state;

  const activeAlts = getActiveAlternativeIndexes(
    alternatives,
    rejectedAlternatives,
  );

  const customScaleMap = buildCustomScaleMap(customScales);
  const unit = objectiveUnits[rowIndex] || "";

  const getMappedValue = (value) => {
    const comparableValue = resolveComparableValue(value, unit, customScaleMap);

    if (!comparableValue?.startsWith("number:")) {
      return NaN;
    }

    return Number(comparableValue.replace("number:", ""));
  };

  const isLowerBetter = sortDirections?.[rowIndex] === SORT_DIRECTIONS.LOWER;

  const validItems = activeAlts
    .map((colIndex) => ({
      colIndex,
      mapped: getMappedValue(cells[`${rowIndex}-${colIndex}`]),
    }))
    .filter((item) => !Number.isNaN(item.mapped))
    .sort((a, b) =>
      isLowerBetter ? a.mapped - b.mapped : b.mapped - a.mapped,
    );

  const ranks = {};
  let currentRank = 1;

  validItems.forEach((item, index) => {
    if (index > 0 && validItems[index - 1].mapped !== item.mapped) {
      currentRank++;
    }

    ranks[item.colIndex] = currentRank;
  });

  return ranks;
};

// Evaluates strict and practical Pareto domination between alternatives.
export const analyzeDomination = (
  state,
  equalizedRowsIndexes,
  completeAlts,
  activeObjForCheck,
) => {
  const {
    objectives = [],
    alternatives = [],
    rejectedAlternatives = [],
  } = state;

  const matrix = {};

  objectives.forEach((_, objectiveIndex) => {
    matrix[objectiveIndex] = getRowRanks(objectiveIndex, state);
  });

  const results = {};

  for (
    let candidateIndex = 0;
    candidateIndex < alternatives.length;
    candidateIndex++
  ) {
    if (
      rejectedAlternatives.includes(candidateIndex) ||
      !completeAlts.includes(candidateIndex)
    ) {
      continue;
    }

    let strictlyBy = null;
    let practicallyBy = null;
    let practicalObjName = null;

    for (
      let challengerIndex = 0;
      challengerIndex < alternatives.length;
      challengerIndex++
    ) {
      if (
        candidateIndex === challengerIndex ||
        rejectedAlternatives.includes(challengerIndex) ||
        !completeAlts.includes(challengerIndex)
      ) {
        continue;
      }

      let challengerIsAlwaysBetterOrEqual = true;
      let challengerIsStrictlyBetterAtLeastOnce = false;
      let candidateExceptionsCount = 0;
      let candidateExceptionRow = -1;
      let candidateExceptionRankDiff = 0;

      for (const objectiveIndex of activeObjForCheck) {
        const candidateRank = matrix[objectiveIndex][candidateIndex];
        const challengerRank = matrix[objectiveIndex][challengerIndex];

        if (challengerRank < candidateRank) {
          challengerIsStrictlyBetterAtLeastOnce = true;
        } else if (challengerRank > candidateRank) {
          challengerIsAlwaysBetterOrEqual = false;
          candidateExceptionsCount++;
          candidateExceptionRow = objectiveIndex;
          candidateExceptionRankDiff = challengerRank - candidateRank;
        }
      }

      if (
        challengerIsAlwaysBetterOrEqual &&
        challengerIsStrictlyBetterAtLeastOnce
      ) {
        strictlyBy = alternatives[challengerIndex];
        break;
      }

      if (
        candidateExceptionsCount === 1 &&
        candidateExceptionRankDiff === 1 &&
        challengerIsStrictlyBetterAtLeastOnce
      ) {
        practicallyBy = alternatives[challengerIndex];
        practicalObjName = objectives[candidateExceptionRow];
      }
    }

    if (strictlyBy) {
      results[candidateIndex] = {
        type: DOMINATION_TYPES.STRICT,
        by: strictlyBy,
      };
    } else if (practicallyBy) {
      results[candidateIndex] = {
        type: DOMINATION_TYPES.PRACTICAL,
        by: practicallyBy,
        objective: practicalObjName,
      };
    }
  }

  return { results, matrix };
};

// Derived selector for table analysis results.
export const getTradeoffResults = (state) => {
  const {
    showRanking,
    alternatives = [],
    objectives = [],
    rejectedAlternatives = [],
    cells = {},
  } = state;

  const equalizedRowsIndexes = getEqualizedRowsIndexes(state);
  const equalizedCount = equalizedRowsIndexes.length;

  const activeAlts = getNonEmptyActiveAlternativeIndexes(
    alternatives,
    rejectedAlternatives,
    objectives,
    cells,
  );

  const activeObjForCheck = objectives
    .map((_, objectiveIndex) => objectiveIndex)
    .filter((objectiveIndex) => {
      if (equalizedRowsIndexes.includes(objectiveIndex)) return false;

      return activeAlts.some((alternativeIndex) =>
        hasCellValue(cells[`${objectiveIndex}-${alternativeIndex}`]),
      );
    });

  const completeAlts = activeAlts.filter((alternativeIndex) =>
    activeObjForCheck.every((objectiveIndex) =>
      hasCellValue(cells[`${objectiveIndex}-${alternativeIndex}`]),
    ),
  );

  const { results: dominationResults, matrix: currentMatrix } = showRanking
    ? analyzeDomination(
        state,
        equalizedRowsIndexes,
        completeAlts,
        activeObjForCheck,
      )
    : { results: {}, matrix: {} };

  let winnerIndex = null;
  const isRaceFinished = completeAlts.length === activeAlts.length;

  if (showRanking && completeAlts.length > 0 && isRaceFinished) {
    if (completeAlts.length === 1) {
      winnerIndex = completeAlts[0];
    } else if (activeObjForCheck.length > 0) {
      const perfectAlts = completeAlts.filter((alternativeIndex) =>
        activeObjForCheck.every(
          (objectiveIndex) =>
            currentMatrix[objectiveIndex] &&
            currentMatrix[objectiveIndex][alternativeIndex] === 1,
        ),
      );

      if (perfectAlts.length === 1) {
        winnerIndex = perfectAlts[0];
      } else {
        const contenders = completeAlts.filter(
          (alternativeIndex) =>
            !dominationResults[alternativeIndex] ||
            dominationResults[alternativeIndex].type !==
              DOMINATION_TYPES.STRICT,
        );

        if (contenders.length === 1) {
          winnerIndex = contenders[0];
        }
      }
    }
  }

  return {
    equalizedRowsIndexes,
    equalizedCount,
    dominationResults,
    currentMatrix,
    activeAlts,
    activeObjForCheck,
    completeAlts,
    winnerIndex,
  };
};
