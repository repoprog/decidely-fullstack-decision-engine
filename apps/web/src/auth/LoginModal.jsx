import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Lock, LogIn, Mail, UserCheck } from "lucide-react";
import { getApiErrorMessage } from "../api/apiError";
import { APP_ROUTES } from "../constants/appConstants";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/modals/Modal";
import useAuthStore from "../store/useAuthStore";

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export function LoginModal({ isOpen, onClose, onSwitchToRegister }) {
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const login = useAuthStore((state) => state.login);
  const demoLogin = useAuthStore((state) => state.demoLogin);
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
    resolver: zodResolver(loginSchema),
  });

  const closeModal = () => {
    reset();
    setGlobalError("");
    onClose();
  };

  const switchToRegister = () => {
    closeModal();
    onSwitchToRegister?.();
  };

  const redirectAfterLogin = () => {
    if (pendingRedirectPath) {
      setPendingRedirectPath(null);
      navigate(pendingRedirectPath);
      return;
    }

    if (location.pathname === APP_ROUTES.HOME || location.pathname === "/") {
      navigate(APP_ROUTES.TABLE);
    }
  };

  const submitLogin = async (email, password, fallbackMessage) => {
    setGlobalError("");
    setLoading(true);

    try {
      await login(email, password);

      closeModal();
      redirectAfterLogin();
    } catch (error) {
      setGlobalError(getApiErrorMessage(error, fallbackMessage));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    await submitLogin(
      data.email,
      data.password,
      "Nie udało się zalogować. Sprawdź swoje dane.",
    );
  };

  const handleGuestLogin = async () => {
    setGlobalError("");
    setLoading(true);

    try {
      await demoLogin();

      closeModal();
      redirectAfterLogin();
    } catch (error) {
      setGlobalError(
        getApiErrorMessage(error, "Błąd logowania do konta demonstracyjnego."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} size="sm">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Decidely.
        </h1>
        <p className="text-muted-foreground mt-2">Witaj z powrotem</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {globalError && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm animate-in fade-in zoom-in-95">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {globalError}
          </div>
        )}

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

        <Button type="submit" disabled={loading} className="w-full">
          <LogIn className="w-4 h-4 mr-2" />
          {loading ? "Logowanie..." : "Zaloguj się"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
      </div>

      <Button
        variant="secondary"
        className="w-full"
        onClick={handleGuestLogin}
        disabled={loading}
      >
        <UserCheck className="w-4 h-4 mr-2" />
        Zaloguj jako Gość (Demo)
      </Button>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Nie masz konta?{" "}
        <button
          type="button"
          onClick={switchToRegister}
          className="text-primary font-medium hover:underline bg-transparent border-none p-0 cursor-pointer"
        >
          Zarejestruj się
        </button>
      </div>
    </Modal>
  );
}
