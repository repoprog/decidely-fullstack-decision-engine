import React, { memo, useEffect, useState } from "react";
import { DOMINATION_TYPES } from "../../../constants/decisionTypes";

const normalizeForComparison = (value, unit) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  let clean = String(value)
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/−|\u2212/g, "-");

  if (unit) {
    const cleanUnit = String(unit).toLowerCase().replace(/\s/g, "");
    clean = clean.split(cleanUnit).join("");
  }

  clean = clean.replace(",", ".");

  if (!Number.isNaN(Number(clean)) && clean !== "") {
    return Number(clean).toString();
  }

  return clean;
};

const formatValueForSave = (value, unit) => {
  if (value === null || value === undefined || value === "") {
    return value;
  }

  const unitToFormat = unit || "";

  const normalizedUnit = unitToFormat
    .toString()
    .toLowerCase()
    .replace(/\s/g, "");

  let cleanValue = value
    .toString()
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/−|\u2212/g, "-");

  if (normalizedUnit) {
    cleanValue = cleanValue.split(normalizedUnit).join("");
  }

  cleanValue = cleanValue.replace(",", ".");

  if (Number.isNaN(Number(cleanValue)) || cleanValue === "") {
    return value;
  }

  const formattedNumber = Number(cleanValue).toLocaleString("pl-PL", {
    maximumFractionDigits: 4,
  });

  return unitToFormat ? `${formattedNumber} ${unitToFormat}` : formattedNumber;
};

// Keeps read-only/share rendering independent from global Zustand state.
export const TableCell = memo(function TableCell({
  rowIndex,
  colIndex,
  cells,
  originalCells,
  updateCell,
  isReadOnly = false,
  unit,
  rankVal,
  maxRank,
  isWinner,
  isRejected,
  domType,
  isCellEqualized,
  showRanking,
  showRejected,
  showTradeoffs,
  isLastRow,
  isLastCol,
  isFocused,
  setFocusedCell,
}) {
  const cellKey = `${rowIndex}-${colIndex}`;

  const globalVal = cells?.[cellKey] || "";
  const originalVal = originalCells?.[cellKey] || "";

  const [localVal, setLocalVal] = useState(globalVal);

  useEffect(() => {
    setLocalVal(globalVal);
  }, [globalVal]);

  let displayValue = localVal;

  if (showRanking) {
    displayValue = rankVal ? `${rankVal}` : "";
  } else if (!isFocused && localVal !== "" && unit) {
    if (!localVal.toString().includes(unit)) {
      displayValue = `${localVal} ${unit}`;
    }
  }

  const isFirst = rankVal === 1;
  const isLast = rankVal === maxRank && maxRank > 1;

  let bgStyle = "bg-card";

  if (isWinner) {
    bgStyle = "bg-green-50 dark:bg-green-900/10";
  } else if (domType === DOMINATION_TYPES.STRICT) {
    bgStyle = "bg-red-50 dark:bg-red-950/30";
  } else if (domType === DOMINATION_TYPES.PRACTICAL) {
    bgStyle = "bg-amber-50 dark:bg-amber-950/30";
  }

  let tdClass = "";

  if (isRejected && !showRejected) {
    tdClass = "hidden";
  } else if (isRejected && showRejected) {
    tdClass = "opacity-30";
  }

  const isEffectivelyDifferent =
    normalizeForComparison(originalVal, unit) !==
    normalizeForComparison(localVal, unit);

  const hasChangedInTradeoff =
    showTradeoffs &&
    !showRanking &&
    originalVal !== "" &&
    isEffectivelyDifferent;

  const hasValidValue =
    localVal !== undefined && localVal.toString().trim() !== "";

  // Highlights the best raw value in a row when the row has a meaningful comparison.
  const showGreenDot =
    !showRanking && isFirst && maxRank > 1 && hasValidValue && !isCellEqualized;

  const inputColor = showRanking
    ? isFirst
      ? "text-green-600 dark:text-green-400"
      : isLast
        ? "text-red-600 dark:text-red-400"
        : "text-foreground"
    : "text-foreground";

  const inputWeight = showRanking ? "font-bold" : "font-normal";

  const handleChange = (event) => {
    if (isReadOnly || showRanking) {
      return;
    }

    setLocalVal(event.target.value);
  };

  const handleBlur = () => {
    setFocusedCell(null);

    if (isReadOnly || showRanking) {
      return;
    }

    const valueToSave = formatValueForSave(localVal, unit);

    if (valueToSave !== localVal) {
      setLocalVal(valueToSave);
    }

    if (valueToSave !== globalVal) {
      updateCell(rowIndex, colIndex, valueToSave);
    }
  };

  const handleFocus = () => {
    if (isReadOnly || showRanking) {
      return;
    }

    setFocusedCell(cellKey);

    if (unit && localVal.toString().includes(unit)) {
      const cleanValue = localVal.toString().replace(unit, "").trim();
      setLocalVal(cleanValue);
    }
  };

  return (
    <td
      className={`p-1.5 align-middle border-b border-r border-border overflow-hidden text-ellipsis transition-colors ${bgStyle} ${tdClass} ${
        isLastRow && isLastCol && !showRanking ? "rounded-br-xl" : ""
      }`}
    >
      <div className="relative flex flex-row items-center justify-center w-full h-full min-h-[32px]">
        {hasChangedInTradeoff && (
          <span className="absolute -top-1 right-1 text-xs text-destructive line-through whitespace-nowrap pointer-events-none z-10">
            {originalVal}
          </span>
        )}

        {showGreenDot && (
          <span
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-green-500 rounded-full z-10 shadow-[0_0_0_2px_rgba(34,197,94,0.2)] pointer-events-none"
            title="Najlepsza wartość w tym kryterium"
          />
        )}

        <input
          className={`w-full py-1.5 px-0.5 border border-transparent bg-transparent rounded-md text-sm transition-all box-border text-center
            [&:not(:read-only)]:hover:bg-muted/50 [&:not(:read-only)]:focus:outline-none [&:not(:read-only)]:focus:bg-card
            [&:not(:read-only)]:focus:border-primary [&:not(:read-only)]:focus:ring-2 [&:not(:read-only)]:focus:ring-primary/20
            read-only:text-center ${inputColor} ${inputWeight} ${
              isCellEqualized ? "line-through !text-muted-foreground opacity-50" : ""
            }`}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          placeholder={showRanking ? "-" : "wartość"}
          readOnly={isReadOnly || showRanking}
          list={!isReadOnly && !showRanking ? "scale-suggestions" : undefined}
        />
      </div>
    </td>
  );
});
