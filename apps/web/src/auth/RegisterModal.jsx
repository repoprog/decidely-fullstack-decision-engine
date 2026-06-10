import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Lock, Mail, User, UserPlus } from "lucide-react";
import { getApiErrorMessage } from "../api/apiError";
import { APP_ROUTES } from "../constants/appConstants";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/modals/Modal";
import useAuthStore from "../store/useAuthStore";

const registerSchema = z
  .object({
    name: z.string().min(2, "Imię musi mieć co najmniej 2 znaki"),
    email: z.string().email("Nieprawidłowy format adresu email"),
    password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie pasują do siebie",
    path: ["confirmPassword"],
  });

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const registerAction = useAuthStore((state) => state.register);
  const pendingRedirectPath = useAuthStore(
    (state) => state.pendingRedirectPath,
  );
  const setPendingRedirectPath = useAuthStore(
    (state) => state.setPendingRedirectPath,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const closeModal = () => {
    reset();
    setGlobalError("");
    onClose();
  };

  const switchToLogin = () => {
    closeModal();
    onSwitchToLogin?.();
  };

  const redirectAfterRegister = () => {
    if (pendingRedirectPath) {
      setPendingRedirectPath(null);
      navigate(pendingRedirectPath);
      return;
    }

    if (location.pathname === APP_ROUTES.HOME || location.pathname === "/") {
      navigate(APP_ROUTES.TABLE);
    }
  };

  const onSubmit = async (data) => {
    setGlobalError("");
    setLoading(true);

    try {
      await registerAction(data.name, data.email, data.password);

      closeModal();
      redirectAfterRegister();
    } catch (error) {
      setGlobalError(
        getApiErrorMessage(error, "Nie udało się utworzyć konta."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} size="sm">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-medium mb-2 text-foreground">Decidely.</h1>
        <p className="text-muted-foreground mt-2">Utwórz nowe konto</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {globalError && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm animate-in fade-in zoom-in-95">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {globalError}
          </div>
        )}

        <Input
          label="Imię"
          type="text"
          icon={User}
          placeholder="np. Jan"
          disabled={loading}
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          label="Email"
          type="email"
          icon={Mail}
          placeholder="twoj@email.com"
          disabled={loading}
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Hasło"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          disabled={loading}
          error={errors.password?.message}
          {...register("password")}
        />

        <Input
          label="Potwierdź hasło"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          disabled={loading}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" disabled={loading} className="w-full mt-2">
          <UserPlus className="w-4 h-4 mr-2" />
          {loading ? "Rejestracja..." : "Zarejestruj się"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Masz już konto?{" "}
        <button
          type="button"
          onClick={switchToLogin}
          className="text-primary font-medium hover:underline bg-transparent border-none p-0 cursor-pointer"
        >
          Zaloguj się
        </button>
      </div>
    </Modal>
  );
}
