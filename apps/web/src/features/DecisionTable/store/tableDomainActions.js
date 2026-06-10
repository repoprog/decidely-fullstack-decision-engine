import { SORT_DIRECTIONS } from "../../../constants/decisionTypes.js";
import {
  removeAlternativeFromTableState,
  removeObjectiveFromTableState,
} from "../logic/tableMatrixTransformers.js";

export const createTableDomainActions = (set, withDirty) => ({
  addAlternative: () =>
    set((state) =>
      withDirty(state, {
        alternatives: [
          ...state.alternatives,
          `Alternatywa ${state.alternatives.length + 1}`,
        ],
      }),
    ),

  addObjective: () =>
    set((state) =>
      withDirty(state, {
        objectives: [...state.objectives, `Cel ${state.objectives.length + 1}`],
      }),
    ),

  updateAlternative: (index, value) =>
    set((state) => {
      const alternatives = [...state.alternatives];
      alternatives[index] = value;

      return withDirty(state, {
        alternatives,
      });
    }),

  removeAlternative: (indexToRemove) =>
    set((state) =>
      withDirty(state, removeAlternativeFromTableState(state, indexToRemove)),
    ),

  removeObjective: (indexToRemove) =>
    set((state) =>
      withDirty(state, removeObjectiveFromTableState(state, indexToRemove)),
    ),

  updateObjective: (index, value) =>
    set((state) => {
      const objectives = [...state.objectives];
      objectives[index] = value;

      return withDirty(state, {
        objectives,
      });
    }),

  updateCell: (row, col, value) =>
    set((state) => {
      const key = `${row}-${col}`;

      const cells = {
        ...state.cells,
        [key]: value,
      };

      const originalCells = { ...state.originalCells };

      if (
        state.showTradeoffs &&
        state.originalCells[key] === undefined &&
        state.cells[key] !== undefined
      ) {
        originalCells[key] = state.cells[key];
      }

      return withDirty(state, {
        cells,
        originalCells,
      });
    }),

  updateUnit: (row, value) =>
    set((state) =>
      withDirty(state, {
        objectiveUnits: {
          ...state.objectiveUnits,
          [row]: value,
        },
      }),
    ),

  toggleSortDirection: (row) =>
    set((state) =>
      withDirty(state, {
        sortDirections: {
          ...state.sortDirections,
          [row]:
            state.sortDirections[row] === SORT_DIRECTIONS.LOWER
              ? SORT_DIRECTIONS.HIGHER
              : SORT_DIRECTIONS.LOWER,
        },
      }),
    ),

  rejectAlternative: (index) =>
    set((state) =>
      withDirty(state, {
        rejectedAlternatives: state.rejectedAlternatives.includes(index)
          ? state.rejectedAlternatives
          : [...state.rejectedAlternatives, index],
        showRejected: false,
      }),
    ),
  restoreAlternative: (index) =>
    set((state) =>
      withDirty(state, {
        rejectedAlternatives: state.rejectedAlternatives.filter(
          (item) => item !== index,
        ),
      }),
    ),
});
