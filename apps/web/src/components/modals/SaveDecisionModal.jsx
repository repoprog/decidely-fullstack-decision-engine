import React, { useState } from "react";
import { Save, AlertCircle } from "lucide-react";
import { Modal } from "../modals/Modal";
import { Button } from "../ui/Button";

export function SaveDecisionModal({
  isOpen,
  onClose,
  title,
  placeholder,
  onSubmit,
  isSaving,
}) {
  const [localTitle, setLocalTitle] = useState("");
  const [localNotes, setLocalNotes] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    setLocalTitle("");
    setLocalNotes("");
    setError("");
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!localTitle.trim()) {
      setError("Nazwa decyzji jest wymagana.");
      return;
    }

    onSubmit({ title: localTitle.trim(), notes: localNotes.trim() });
    setLocalTitle("");
    setLocalNotes("");
    setError("");
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm" title={title}>
      <div className="relative">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Nazwa decyzji <span className="text-destructive">*</span>
            </label>
            <input
              autoFocus
              value={localTitle}
              onChange={(e) => {
                setLocalTitle(e.target.value);
                if (error) setError("");
              }}
              placeholder={placeholder}
              className={`w-full px-4 py-3 bg-muted/30 border rounded-lg outline-none transition-colors text-foreground ${
                error
                  ? "border-destructive focus:border-destructive"
                  : "border-border focus:border-primary"
              }`}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Notatki{" "}
              <span className="text-muted-foreground text-xs">
                (opcjonalne)
              </span>
            </label>
            <textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              placeholder="Dodaj kontekst, powody wyboru lub inne istotne informacje..."
              className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg outline-none focus:border-primary transition-colors resize-none text-foreground"
              rows={4}
              disabled={isSaving}
            />
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
              <Save className="w-4 h-4" />
              {isSaving ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
