export const createTableViewActions = (set) => ({
  toggleTradeoffs: () =>
    set((state) => {
      if (!state.showTradeoffs) {
        return {
          showTradeoffs: true,
          originalCells: { ...state.cells },
          showRanking: false,
        };
      }

      return {
        showTradeoffs: false,
        originalCells: {},
      };
    }),

  toggleRanking: () =>
    set((state) => ({
      showRanking: !state.showRanking,
      showTradeoffs: !state.showRanking ? false : state.showTradeoffs,
    })),

  toggleShowRejected: () =>
    set((state) => ({
      showRejected: !state.showRejected,
    })),

  toggleHideEqualized: () =>
    set((state) => ({
      hideEqualizedObjectives: !state.hideEqualizedObjectives,
    })),
});