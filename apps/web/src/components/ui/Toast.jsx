import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

export function Toast({
  id,
  message,
  type = "info",
  duration = 3000,
  onClose,
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose, id]);

  const handleManualClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
  };

  const styles = {
    success: "bg-green-500/10 text-green-600 border-green-500/20",
    error: "bg-destructive/10 text-destructive border-destructive/20",
    info: "bg-primary/10 text-primary border-primary/20",
    warning: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  };

  return (
    <div
      className={`transition-all duration-300 pointer-events-auto ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 border rounded-lg shadow-lg min-w-[300px] bg-background ${styles[type]}`}
      >
        {icons[type]}
        <span className="flex-1 text-sm font-medium">{message}</span>
        <button
          onClick={handleManualClose}
          className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
