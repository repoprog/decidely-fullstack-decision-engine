import React, { useState } from "react";
import { Camera, AlertCircle } from "lucide-react";
import { Modal } from "../modals/Modal";
import { Button } from "../ui/Button";

export function SaveVersionModal({ isOpen, onClose, onSubmit, isSaving }) {
  const [localLabel, setLocalLabel] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    setLocalLabel("");
    setError("");
    onClose();
  };

  const handleGenerateAutoName = (e) => {
    e.preventDefault();
    const now = new Date();
    const date = now.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
    });
    const time = now.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setLocalLabel(`Wersja z ${date} ${time}`);
    if (error) setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!localLabel.trim()) {
      setError("Nazwa wersji jest wymagana.");
      return;
    }

    onSubmit(localLabel.trim());
    setLocalLabel("");
    setError("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      title="Zapisz wersję"
    >
      <div className="relative">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Camera className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary mb-1">Tworzysz snapshot</p>
              <p className="text-muted-foreground">
                Ta wersja zostanie zapisana w historii i będziesz mógł do niej
                wrócić w dowolnym momencie.
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Nazwa wersji <span className="text-destructive">*</span>
            </label>
            <input
              autoFocus
              value={localLabel}
              onChange={(e) => {
                setLocalLabel(e.target.value);
                if (error) setError("");
              }}
              placeholder="np. Przed zmianami w Q2"
              className={`w-full px-4 py-3 bg-muted/30 border rounded-lg outline-none transition-colors text-foreground ${
                error
                  ? "border-destructive focus:border-destructive"
                  : "border-border focus:border-primary"
              }`}
              disabled={isSaving}
            />

            <button
              type="button"
              onClick={handleGenerateAutoName}
              className="text-sm text-primary hover:underline mt-2 text-left cursor-pointer disabled:cursor-default"
              disabled={isSaving}
            >
              Wygeneruj automatyczną nazwę
            </button>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSaving}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              {isSaving ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
