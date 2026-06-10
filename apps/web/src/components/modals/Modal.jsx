import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "../ui/Button";

export function Modal({ isOpen, onClose, title, children, size = "md" }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative bg-background border border-border rounded-lg shadow-lg ${sizeClasses[size]} w-full mx-4 max-h-[90vh] overflow-auto`}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h3 className="font-medium text-foreground">{title}</h3>

            <Button variant="ghost" size="iconSm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
        <div className={title ? "p-6" : "p-6 pt-8"}>
          {!title && (
            <div className="absolute top-4 right-4">
              <Button variant="ghost" size="iconSm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>,
    document.getElementById("portal-root"),
  );
}
