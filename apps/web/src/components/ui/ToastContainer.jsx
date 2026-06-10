import { useToastStore } from "../../store/useToastStore";
import { Toast } from "./Toast";

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          id={t.id}
          message={t.message}
          type={t.type}
          duration={t.duration}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}
