import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, Save, User } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { getApiErrorMessage } from "../api/apiError";
import { userApi } from "../api/userApi";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import useAuthStore from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";

const profileSchema = z.object({
  name: z.string().min(2, "Imię musi mieć minimum 2 znaki"),
  email: z.string().email("Nieprawidłowy format adresu email"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Obecne hasło jest wymagane"),
    newPassword: z.string().min(8, "Nowe hasło musi mieć minimum 8 znaków"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Nowe hasła nie pasują do siebie",
    path: ["confirmPassword"],
  });

export default function Settings() {
  const { user, fetchProfile } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const [isLoading, setIsLoading] = useState(false);



  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });
  
  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name,
        email: user.email,
      });
    }
  }, [user, profileForm]);

  const onProfileSubmit = async (data) => {
    setIsLoading(true);

    try {
      await userApi.updateProfile(data);
      await fetchProfile();

      profileForm.reset({
        name: data.name,
        email: data.email,
      });

      addToast("Profil został zaktualizowany pomyślnie.", "success");
    } catch (error) {
      addToast(
        getApiErrorMessage(error, "Nie udało się zaktualizować profilu."),
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setIsLoading(true);

    try {
      await userApi.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      passwordForm.reset();
      addToast("Hasło zostało zmienione pomyślnie.", "success");
    } catch (error) {
      addToast(
        getApiErrorMessage(error, "Nie udało się zmienić hasła."),
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Ustawienia</h2>
        <p className="mt-1 text-muted-foreground">
          Zarządzaj swoim kontem i preferencjami
        </p>
      </div>

      <Card className="space-y-6 p-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <User className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium text-foreground">Profil użytkownika</h3>
        </div>

        <form
          onSubmit={profileForm.handleSubmit(onProfileSubmit)}
          className="space-y-4"
        >
          <Input
            label="Imię i nazwisko"
            icon={User}
            error={profileForm.formState.errors.name?.message}
            {...profileForm.register("name")}
          />

          <Input
            label="Email"
            type="email"
            icon={Mail}
            error={profileForm.formState.errors.email?.message}
            {...profileForm.register("email")}
          />

          <Button
            type="submit"
            disabled={isLoading || !profileForm.formState.isDirty}
          >
            <Save className="mr-2 h-4 w-4" />
            Zapisz profil
          </Button>
        </form>
      </Card>

      <Card className="space-y-6 p-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium text-foreground">Zmiana hasła</h3>
        </div>

        <form
          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
          className="space-y-4"
        >
          <Input
            label="Obecne hasło"
            type="password"
            icon={Lock}
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register("currentPassword")}
          />

          <Input
            label="Nowe hasło"
            type="password"
            icon={Lock}
            error={passwordForm.formState.errors.newPassword?.message}
            {...passwordForm.register("newPassword")}
          />

          <Input
            label="Potwierdź nowe hasło"
            type="password"
            icon={Lock}
            error={passwordForm.formState.errors.confirmPassword?.message}
            {...passwordForm.register("confirmPassword")}
          />

          <Button type="submit" disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            Zmień hasło
          </Button>
        </form>
      </Card>
    </div>
  );
}