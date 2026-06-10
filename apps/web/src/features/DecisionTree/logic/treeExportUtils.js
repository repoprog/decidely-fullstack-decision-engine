import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const EXPORT_STYLE_ID = "react-flow-export-style";

const EXPORT_PADDING = {
  x: 100,
  top: 180,
  bottom: 100,
};

const EXPORT_FILE_NAME = "drzewo-decyzyjne";

const createExportStyles = () => {
  const styleElement = document.createElement("style");
  styleElement.id = EXPORT_STYLE_ID;

  styleElement.innerHTML = `
    .react-flow * {
      transition: none !important;
    }

    .hide-on-export-img {
      display: none !important;
    }

    .show-on-export-img {
      display: block !important;
    }

    .export-force-light-legend {
      background-color: #ffffff !important;
      backdrop-filter: none !important;
      border-color: #e2e8f0 !important;
      color: #64748b !important;
    }

    .export-force-light-legend svg {
      color: #0f172a !important;
      fill: #ffffff !important;
    }

    input[placeholder^="Etap"],
    input[placeholder="Konsekwencje"] {
      color: #1e293b !important;
    }

    button[title^="Zmień na poszukiwanie"] {
      background-color: #ecfdf5 !important;
      border-color: #34d399 !important;
      color: #065f46 !important;
    }

    button[title^="Zmień na poszukiwanie"] span {
      color: #059669 !important;
    }

    .react-flow__node div[class*="dark:bg-slate-900"],
    .react-flow__node div[class*="dark:bg-emerald-950"] {
      backdrop-filter: none !important;
    }

    .react-flow__node div[class*="dark:bg-slate-900"] {
      background-color: #ffffff !important;
      border-color: #94a3b8 !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
    }

    .react-flow__node span[class*="dark:text-yellow-400"] {
      color: #b45309 !important;
      filter: none !important;
    }

    .react-flow__node div[class*="dark:bg-emerald-950"] {
      background-color: #ecfdf5 !important;
      border-color: #34d399 !important;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
    }

    .react-flow__node span[class*="dark:text-emerald-300"] {
      color: #047857 !important;
    }
  `;

  return styleElement;
};

const shouldIncludeInExport = (node) => {
  if (node?.classList?.contains("tree-toolbar-export")) return false;
  if (node?.classList?.contains("react-flow__controls")) return false;
  if (node?.classList?.contains("react-flow__minimap")) return false;
  if (node?.classList?.contains("hide-on-export")) return false;

  return true;
};

const downloadPng = (dataUrl) => {
  const link = document.createElement("a");

  link.download = `${EXPORT_FILE_NAME}.png`;
  link.href = dataUrl;
  link.click();
};

const downloadPdf = ({ dataUrl, width, height }) => {
  const pdf = new jsPDF({
    orientation: width > height ? "landscape" : "portrait",
    unit: "px",
    format: [width, height],
  });

  pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
  pdf.save(`${EXPORT_FILE_NAME}.pdf`);
};

const waitForViewportUpdate = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });

export const exportGraph = async ({
  format,
  getNodes,
  getNodesBounds,
  getViewport,
  setViewport,
  addToast,
}) => {
  const nodes = getNodes();

  if (nodes.length === 0) {
    addToast("Plansza jest pusta. Brak danych do eksportu.", "warning");
    return;
  }

  const flowWrapper = document.querySelector(".react-flow");

  if (!flowWrapper) {
    addToast("Nie udało się odnaleźć planszy do eksportu.", "error");
    return;
  }

  const nodesBounds = getNodesBounds(nodes);
  const imageWidth = nodesBounds.width + EXPORT_PADDING.x * 2;
  const imageHeight =
    nodesBounds.height + EXPORT_PADDING.top + EXPORT_PADDING.bottom;

  const currentViewport = getViewport();
  const originalWidth = flowWrapper.style.width;
  const originalHeight = flowWrapper.style.height;

  const backgroundElement = document.querySelector(".react-flow__background");
  const originalBackgroundDisplay = backgroundElement?.style.display ?? "";

  const exportStyles = createExportStyles();

  try {
    if (backgroundElement) {
      backgroundElement.style.display = "none";
    }

    flowWrapper.style.width = `${imageWidth}px`;
    flowWrapper.style.height = `${imageHeight}px`;

    document.head.appendChild(exportStyles);

    setViewport({
      x: -nodesBounds.x + EXPORT_PADDING.x,
      y: -nodesBounds.y + EXPORT_PADDING.top,
      zoom: 1,
    });

    await waitForViewportUpdate();

    const dataUrl = await toPng(flowWrapper, {
      backgroundColor: "#ffffff",
      width: imageWidth,
      height: imageHeight,
      pixelRatio: 2,
      filter: shouldIncludeInExport,
    });

    if (format === "png") {
      downloadPng(dataUrl);
      return;
    }

    if (format === "pdf") {
      downloadPdf({
        dataUrl,
        width: imageWidth,
        height: imageHeight,
      });
      return;
    }

    addToast("Nieobsługiwany format eksportu.", "error");
  } catch {
    addToast("Wystąpił błąd podczas eksportowania planszy.", "error");
  } finally {
    if (document.head.contains(exportStyles)) {
      document.head.removeChild(exportStyles);
    }

    flowWrapper.style.width = originalWidth;
    flowWrapper.style.height = originalHeight;
    setViewport(currentViewport);

    if (backgroundElement) {
      backgroundElement.style.display = originalBackgroundDisplay;
    }
  }
};
