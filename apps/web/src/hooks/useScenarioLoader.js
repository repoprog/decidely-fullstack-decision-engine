import { useState, useEffect, useCallback } from "react";

export function useScenarioLoader({ isDirty, loadFn, fetchFn }) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [scenariosList, setScenariosList] = useState([]);
  const [pendingTemplateId, setPendingTemplateId] = useState(null);

 useEffect(() => {
  fetchFn()
    .then(setScenariosList)
    .catch(() => setScenariosList([]));
}, [fetchFn]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scenarioKey = params.get("scenario");

    if (scenarioKey) {
      loadFn(scenarioKey);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [loadFn]);

  const handleTemplateClick = useCallback(
    (id) => {
      if (isDirty) {
        setPendingTemplateId(id);
      } else {
        loadFn(id);
        setShowTemplates(false);
      }
    },
    [isDirty, loadFn],
  );

  const confirmLoadTemplate = useCallback(() => {
    if (pendingTemplateId) {
      loadFn(pendingTemplateId);
      setPendingTemplateId(null);
      setShowTemplates(false);
    }
  }, [pendingTemplateId, loadFn]);

  return {
    showTemplates,
    setShowTemplates,
    scenariosList,
    pendingTemplateId,
    setPendingTemplateId,
    handleTemplateClick,
    confirmLoadTemplate,
  };
}
