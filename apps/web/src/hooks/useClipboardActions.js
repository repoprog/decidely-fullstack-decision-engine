import { useTreeStore } from "../features/DecisionTree/store/useTreeStore.js";
import { useToastStore } from "../store/useToastStore.js";


export function useClipboardActions(id, isEdge = true) {
  const updateEdgeData = useTreeStore((s) => s.updateEdgeData);
  const updateNodeData = useTreeStore((s) => s.updateNodeData);
   const addToast = useToastStore((state) => state.addToast);

  const updateFn = isEdge ? updateEdgeData : updateNodeData;

  const executeCopy = (event, value) => {
    event.stopPropagation();

    if (value === null || value === undefined || value === "") {
      return;
    }

    navigator.clipboard.writeText(String(value)).catch(() => {
      addToast("Nie udało się skopiować do schowka.", "error");
    });
  };

 const executePaste = async (event, key) => {
    event.stopPropagation();

    try {
      const text = await navigator.clipboard.readText();

      if (text) {
        updateFn(id, { [key]: text });
      }
    } catch {
      addToast("Wklejanie wymaga HTTPS i zgody na dostęp do schowka.", "error");
    }
  };

  const executeDelete = (e, key, callback) => {
    e.stopPropagation();
    updateFn(id, { [key]: "" });
    if (callback) callback();
  };

  return { executeCopy, executePaste, executeDelete };
}
