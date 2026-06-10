export const removeAlternativeFromTableState = (state, indexToRemove) => {
  const alternatives = state.alternatives.filter(
    (_, index) => index !== indexToRemove,
  );

  const cells = {};
  const originalCells = {};

  for (let row = 0; row < state.objectives.length; row++) {
    for (let col = 0; col < state.alternatives.length; col++) {
      if (col === indexToRemove) {
        continue;
      }

      const newCol = col > indexToRemove ? col - 1 : col;

      if (state.cells[`${row}-${col}`] !== undefined) {
        cells[`${row}-${newCol}`] = state.cells[`${row}-${col}`];
      }

      if (state.originalCells[`${row}-${col}`] !== undefined) {
        originalCells[`${row}-${newCol}`] =
          state.originalCells[`${row}-${col}`];
      }
    }
  }

  return {
    alternatives,
    cells,
    originalCells,
    rejectedAlternatives: state.rejectedAlternatives
      .filter((col) => col !== indexToRemove)
      .map((col) => (col > indexToRemove ? col - 1 : col)),
  };
};

export const removeObjectiveFromTableState = (state, indexToRemove) => {
  const objectives = state.objectives.filter(
    (_, index) => index !== indexToRemove,
  );

  const cells = {};
  const originalCells = {};

  for (let row = 0; row < state.objectives.length; row++) {
    if (row === indexToRemove) {
      continue;
    }

    const newRow = row > indexToRemove ? row - 1 : row;

    for (let col = 0; col < state.alternatives.length; col++) {
      if (state.cells[`${row}-${col}`] !== undefined) {
        cells[`${newRow}-${col}`] = state.cells[`${row}-${col}`];
      }

      if (state.originalCells[`${row}-${col}`] !== undefined) {
        originalCells[`${newRow}-${col}`] =
          state.originalCells[`${row}-${col}`];
      }
    }
  }

  const sortDirections = {};
  Object.keys(state.sortDirections).forEach((key) => {
    const index = Number.parseInt(key, 10);

    if (index === indexToRemove) {
      return;
    }

    sortDirections[index > indexToRemove ? index - 1 : index] =
      state.sortDirections[index];
  });

  const objectiveUnits = {};
  Object.keys(state.objectiveUnits).forEach((key) => {
    const index = Number.parseInt(key, 10);

    if (index === indexToRemove) {
      return;
    }

    objectiveUnits[index > indexToRemove ? index - 1 : index] =
      state.objectiveUnits[index];
  });

  return {
    objectives,
    cells,
    originalCells,
    sortDirections,
    objectiveUnits,
  };
};