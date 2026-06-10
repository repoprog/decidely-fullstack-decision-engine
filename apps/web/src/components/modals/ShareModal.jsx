import { useState } from "react";
import { Check, Copy, Link, Share2 } from "lucide-react";
import { decisionApi } from "../../api/decisionApi";
import { getApiErrorMessage } from "../../api/apiError";
import { useToastStore } from "../../store/useToastStore";
import { Button } from "../ui/Button";
import { Modal } from "../modals/Modal";

const DEFAULT_EXPIRATION_DAYS = "7";

const getExpirationDate = (expiresInDays) => {
  if (expiresInDays === "never") {
    return null;
  }

  const days = Number.parseInt(expiresInDays, 10);

  if (!Number.isFinite(days) || days <= 0) {
    return null;
  }

  const date = new Date();
  date.setDate(date.getDate() + days);

  return date.toISOString();
};

export function ShareModal({ isOpen, onClose, projectId }) {
  const [email, setEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(DEFAULT_EXPIRATION_DAYS);
  const [shareUrl, setShareUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const addToast = useToastStore((state) => state.addToast);
  const trimmedEmail = email.trim();

  if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    addToast("Podaj poprawny adres e-mail albo zostaw pole puste.", "warning");
    return;
  }

  const resetAndClose = () => {
    setShareUrl(null);
    setEmail("");
    setExpiresInDays(DEFAULT_EXPIRATION_DAYS);
    setIsCopied(false);
    onClose();
  };

  const handleGenerateLink = async () => {
    if (!projectId) {
      addToast(
        "Nie można wygenerować linku bez zapisanego projektu.",
        "warning",
      );
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        sharedWithEmail: trimmedEmail || null,
        expiresAt: getExpirationDate(expiresInDays),
      };

      const result = await decisionApi.createShareLink(projectId, payload);

      setShareUrl(result.shareUrl);
      setIsCopied(false);
      addToast("Link wygenerowany pomyślnie.", "success");
    } catch (error) {
      addToast(
        getApiErrorMessage(error, "Nie udało się wygenerować linku."),
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);

      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      addToast("Skopiowano do schowka.", "success");
    } catch {
      addToast(
        "Błąd kopiowania do schowka. Sprawdź uprawnienia przeglądarki.",
        "error",
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      size="sm"
      title="Udostępnij projekt"
    >
      <div className="relative">
        <p className="text-sm text-muted-foreground mb-6">
          Wygeneruj link tylko do odczytu.
        </p>

        {!shareUrl ? (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                E-mail odbiorcy{" "}
                <span className="text-muted-foreground text-xs">
                  (opcjonalnie)
                </span>
              </label>

              <input
                type="email"
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg outline-none focus:border-primary transition-colors text-foreground"
                placeholder="np. kontakt@firma.pl"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Ważność linku
              </label>

              <select
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg outline-none focus:border-primary transition-colors appearance-none cursor-pointer text-foreground"
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(event.target.value)}
              >
                <option value="1">1 dzień</option>
                <option value="7">7 dni</option>
                <option value="30">30 dni</option>
                <option value="never">Nigdy nie wygasa</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="ghost"
                onClick={resetAndClose}
                disabled={isLoading}
              >
                Anuluj
              </Button>

              <Button
                variant="default"
                onClick={handleGenerateLink}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                {isLoading ? "Generowanie..." : "Wygeneruj link"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-muted/30 border border-border rounded-lg flex items-center justify-center relative overflow-hidden">
              <Link className="w-20 h-20 text-primary absolute -right-4 -bottom-4 opacity-5 rotate-12" />

              <p className="text-center text-sm font-medium break-all select-all z-10 text-foreground">
                {shareUrl}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={resetAndClose}
                className="flex-1"
              >
                Zamknij
              </Button>

              <Button
                variant={isCopied ? "success" : "default"}
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2"
              >
                {isCopied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {isCopied ? "Skopiowano!" : "Kopiuj link"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
