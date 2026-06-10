import { treeScenarios } from "../../DecisionTree/data/treeScenarios";
import { tableScenarios } from "../../DecisionTable/data/tableScenarios";

const cloneTemplate = (template) =>
  typeof structuredClone === "function"
    ? structuredClone(template)
    : JSON.parse(JSON.stringify(template));

const mapScenarioList = (scenarios) =>
  Object.entries(scenarios).map(([id, scenario]) => ({
    id,
    name: scenario.name,
    description: scenario.description || "Brak opisu",
  }));

export const localTemplateRepository = {
  async getTreeScenarios() {
    return mapScenarioList(treeScenarios);
  },

  async getTableScenarios() {
    return mapScenarioList(tableScenarios);
  },

  async getTreeTemplate(templateId) {
    const template = treeScenarios[templateId];

    if (!template) {
      throw new Error("Nie znaleziono szablonu drzewa.");
    }

    return cloneTemplate(template);
  },

  async getTableTemplate(templateId) {
    const template = tableScenarios[templateId];

    if (!template) {
      throw new Error("Nie znaleziono szablonu tabeli.");
    }

    return cloneTemplate(template);
  },
};
