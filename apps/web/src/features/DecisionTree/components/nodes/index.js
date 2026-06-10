import { DecisionNode } from "./DecisionNode.jsx";
import { ChanceNode } from "./ChanceNode.jsx";
import { TerminalNode } from "./TerminalNode.jsx";

export const nodeTypes = {
  decision: DecisionNode,
  chance: ChanceNode,
  terminal: TerminalNode,
};

export { DecisionNode, ChanceNode, TerminalNode };
