import { NODE_TYPES } from "../../../constants/decisionTypes";

export const treeScenarios = {
  blank: {
    name: "Pusta karta (od nowa)",
    description:
      "Czyste płótno. Zbuduj własne drzewo decyzyjne od podstaw, dodając węzły i określając prawdopodobieństwa.",
    labels: ["Wybór początkowy"],
    nodes: [
      {
        id: "d1",
        type: NODE_TYPES.DECISION,
        position: { x: 0, y: 0 },
        data: { nodeNumber: 1 },
      },
    ],
    edges: [],
  },

  investment: {
    name: "Analiza Inwestycji ",
    description: "Czy warto inwestować duże środki w nowy produkt?",
    labels: ["W Co Zainwestować?", "Ryzyko Rynkowe", "Wynik Finansowy"],
    nodes: [
      {
        id: "d1",
        type: NODE_TYPES.DECISION,
        position: { x: 0, y: 0 },
        zIndex: 100,
        data: { nodeNumber: 1 },
      },

      {
        id: "c1",
        type: NODE_TYPES.CHANCE,
        position: { x: 0, y: 0 },
        data: { nodeNumber: 2 },
      },

      {
        id: "t1",
        type: NODE_TYPES.TERMINAL,
        position: { x: 0, y: 0 },
        data: { payoff: "200 000" },
      },
      {
        id: "t2",
        type: NODE_TYPES.TERMINAL,
        position: { x: 0, y: 0 },
        data: { payoff: "20 000" },
      },
      {
        id: "t3",
        type: NODE_TYPES.TERMINAL,
        position: { x: 0, y: 0 },
        data: { payoff: "5 000" },
      },
    ],
    edges: [
      {
        id: "e1",
        source: "d1",
        target: "c1",
        type: "smartChoices",
        data: { optionLabel: "Produkt", cost: "50 000", probability: null },
      },
      {
        id: "e2",
        source: "d1",
        target: "t3",
        type: "smartChoices",
        data: { optionLabel: "Lokakata bankowa", cost: "0", probability: null },
      },

      {
        id: "e3",
        source: "c1",
        target: "t1",
        type: "smartChoices",
        data: {
          optionLabel: "Wysoki popyt",
          probability: "60.00%",
          isLocked: true,
        },
      },
      {
        id: "e4",
        source: "c1",
        target: "t2",
        type: "smartChoices",
        data: {
          optionLabel: "Niski popyt (Kryzys)",
          probability: "40.00%",
          isLocked: true,
        },
      },
    ],
  },

  court: {
    name: "Ugoda czy Proces (Prawny)",
    description:
      "Zgodzić się na pewną, ale bolesną ugodę, czy zaryzykować proces sądowy (z kosztami adwokackimi) i walczyć o uniewinnienie?",
    labels: ["Strategia Prawna", "Wyrok Sądu", "Koszty i Kary"],
    nodes: [
      {
        id: "d1",
        type: NODE_TYPES.DECISION,
        position: { x: 0, y: 0 },
        zIndex: 100,
        data: { nodeNumber: 1 },
      },

      {
        id: "c1",
        type: NODE_TYPES.CHANCE,
        position: { x: 0, y: 0 },
        data: { nodeNumber: 2 },
      },

      {
        id: "t1",
        type: NODE_TYPES.TERMINAL,
        position: { x: 0, y: 0 },
        data: { payoff: "-50 000" },
      },
      {
        id: "t2",
        type: NODE_TYPES.TERMINAL,
        position: { x: 0, y: 0 },
        data: { payoff: "0" },
      },
      {
        id: "t3",
        type: NODE_TYPES.TERMINAL,
        position: { x: 0, y: 0 },
        data: { payoff: "-150 000" },
      },
    ],
    edges: [
      {
        id: "e1",
        source: "d1",
        target: "t1",
        type: "smartChoices",
        data: { optionLabel: "Przyjmij ugodę", cost: "0", probability: null },
      },
      {
        id: "e2",
        source: "d1",
        target: "c1",
        type: "smartChoices",
        data: {
          optionLabel: "Idź do sądu",
          cost: "-20 000",
          probability: null,
        },
      }, 

      {
        id: "e3",
        source: "c1",
        target: "t2",
        type: "smartChoices",
        data: {
          optionLabel: "Wygrana (Uniewinnienie)",
          probability: "70.00%",
          isLocked: true,
        },
      },
      {
        id: "e4",
        source: "c1",
        target: "t3",
        type: "smartChoices",
        data: {
          optionLabel: "Przegrana (Maksymalna kara)",
          probability: "30.00%",
          isLocked: true,
        },
      },
    ],
  },

  marketingLaunch: {
    name: "Kampania Marketingowa",
    description:
      "Ryzykowny i drogi viral w Social Mediach czy stabilne, tańsze pozycjonowanie SEO?",
    labels: ["Wybór Kanału", "Reakcja Rynku", "Wynik Finansowy"],
    nodes: [
      {
        id: "d1",
        type: NODE_TYPES.DECISION,
        position: { x: 0, y: 0 },
        zIndex: 100,
        data: { nodeNumber: 1 },
      },
      {
        id: "c1",
        type: NODE_TYPES.CHANCE,
        position: { x: 0, y: 0 },
        data: { nodeNumber: 2 },
      }, 
      {
        id: "c2",
        type: NODE_TYPES.CHANCE,
        position: { x: 0, y: 0 },
        data: { nodeNumber: 3 },
      }, 

      {
        id: "t1",
        type: NODE_TYPES.TERMINAL,
        position: { x: 0, y: 0 },
        data: { payoff: "120 000" },
      }, 
      {
        id: "t2",
        type: NODE_TYPES.TERMINAL,
        position: { x: 0, y: 0 },
        data: { payoff: "5 000" },
      }, 
      {
        id: "t3",
        type: NODE_TYPES.TERMINAL,
        position: { x: 0, y: 0 },
        data: { payoff: "40 000" },
      }, 
      {
        id: "t4",
        type: NODE_TYPES.TERMINAL,
        position: { x: 0, y: 0 },
        data: { payoff: "10 000" },
      },
    ],
    edges: [
      {
        id: "e1",
        source: "d1",
        target: "c1",
        type: "smartChoices",
        data: {
          optionLabel: "Kampania Influencer/SM",
          cost: "-15 000",
          probability: null,
        },
      },
      {
        id: "e2",
        source: "d1",
        target: "c2",
        type: "smartChoices",
        data: {
          optionLabel: "Pozycjonowanie SEO",
          cost: "-4 000",
          probability: null,
        },
      },

      {
        id: "e3",
        source: "c1",
        target: "t1",
        type: "smartChoices",
        data: {
          optionLabel: "Efekt Viralowy",
          probability: "25.00%",
          isLocked: true,
        },
      },
      {
        id: "e4",
        source: "c1",
        target: "t2",
        type: "smartChoices",
        data: {
          optionLabel: "Brak odzewu",
          probability: "75.00%",
          isLocked: true,
        },
      },

      {
        id: "e5",
        source: "c2",
        target: "t3",
        type: "smartChoices",
        data: {
          optionLabel: "Top 3 w Google",
          probability: "80.00%",
          isLocked: true,
        },
      },
      {
        id: "e6",
        source: "c2",
        target: "t4",
        type: "smartChoices",
        data: {
          optionLabel: "Spadek w rankingach",
          probability: "20.00%",
          isLocked: true,
        },
      },
    ],
  },

  basketball: {
    name: "Rzut w Ostatniej Sekundzie",
    description:
      "Finałowy mecz, tracisz 2 punkty. Rzucać bezpieczniej za 2 punkty (i liczyć na wygraną w dogrywce), czy zaryzykować rzut za 3 punkty po natychmiastowe zwycięstwo?",
    labels: ["Jaki rzut?", "Rzut udany?", "Dogrywka (OT)", "Rezultat końcowy"],
    nodes: [
      {
        id: "d1",
        type: NODE_TYPES.DECISION,
        position: { x: 0, y: 0 },
        zIndex: 100,
        data: { nodeNumber: 1 },
      },
      {
        id: "c1",
        type: NODE_TYPES.CHANCE,
        position: { x: 0, y: 0 },
        data: { nodeNumber: 2 },
      },
      {
        id: "c2",
        type: NODE_TYPES.CHANCE,
        position: { x: 0, y: 0 },
        data: { nodeNumber: 3 },
      },
      {
        id: "c3",
        type: NODE_TYPES.CHANCE,
        position: { x: 0, y: 0 },
        data: { nodeNumber: 4 },
      },

      {
        id: "t1",
        type: NODE_TYPES.TERMINAL,
        position: { x: 0, y: 0 },
        data: { payoff: "0 (Przegrana)" },
      },
      {
        id: "t2",
        type: NODE_TYPES.TERMINAL,
        position: { x: 0, y: 0 },
        data: { payoff: "100 (Wygrana)" },
      },
      {
        id: "t3",
        type: NODE_TYPES.TERMINAL,
        position: { x: 0, y: 0 },
        data: { payoff: "0 (Przegrana)" },
      },
      {
        id: "t4",
        type: NODE_TYPES.TERMINAL,
        position: { x: 0, y: 0 },
        data: { payoff: "100 (Wygrana)" },
      },
      {
        id: "t5",
        type: NODE_TYPES.TERMINAL,
        position: { x: 0, y: 0 },
        data: { payoff: "0 (Przegrana)" },
      },
    ],
    edges: [
      {
        id: "e1",
        source: "d1",
        target: "c1",
        type: "smartChoices",
        data: { optionLabel: "Za 2 punkty", probability: null },
      },
      {
        id: "e2",
        source: "d1",
        target: "c2",
        type: "smartChoices",
        data: { optionLabel: "Za 3 punkty", probability: null },
      },

      {
        id: "e3",
        source: "c1",
        target: "c3",
        type: "smartChoices",
        data: {
          optionLabel: "Trafiony",
          probability: "55.00%",
          isLocked: true,
        },
      },
      {
        id: "e4",
        source: "c1",
        target: "t1",
        type: "smartChoices",
        data: { optionLabel: "Pudło", probability: "45.00%", isLocked: true },
      },

      {
        id: "e5",
        source: "c3",
        target: "t2",
        type: "smartChoices",
        data: {
          optionLabel: "Wygrana w OT",
          probability: "50.00%",
          isLocked: true,
        },
      },
      {
        id: "e6",
        source: "c3",
        target: "t3",
        type: "smartChoices",
        data: {
          optionLabel: "Porażka w OT",
          probability: "50.00%",
          isLocked: true,
        },
      },

      {
        id: "e7",
        source: "c2",
        target: "t4",
        type: "smartChoices",
        data: {
          optionLabel: "Trafiony",
          probability: "38.00%",
          isLocked: true,
        },
      },
      {
        id: "e8",
        source: "c2",
        target: "t5",
        type: "smartChoices",
        data: { optionLabel: "Pudło", probability: "62.00%", isLocked: true },
      },
    ],
  },
};
