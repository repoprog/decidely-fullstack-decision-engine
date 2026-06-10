export function getApiStatus(error) {
  return error?.response?.status ?? null;
}

export function getApiErrorMessage(
  error,
  fallbackMessage = "Wystąpił nieoczekiwany błąd.",
) {
  if (!error) return fallbackMessage;

  if (error.name === "CanceledError" || error.name === "AbortError") {
    return "Operacja przekroczyła limit czasu (timeout).";
  }

  if (!error.response) {
    return "Nie można połączyć się z serwerem. Sprawdź połączenie z internetem.";
  }

  const status = getApiStatus(error);
  if (status === 409) {
    return "Projekt został zmieniony w innej sesji. Odśwież projekt przed kolejnym zapisem.";
  }

  const serverMessage = error.response.data?.message;

  if (serverMessage && typeof serverMessage === "string") {
    return serverMessage;
  }

  switch (status) {
    case 400:
      return "Nieprawidłowe dane wejściowe.";
    case 401:
      return "Sesja wygasła. Zaloguj się ponownie.";
    case 403:
      return "Nie masz uprawnień do tej operacji.";
    case 404:
      return "Nie znaleziono żądanego zasobu.";
    case 422:
      return "Dane nie przeszły walidacji.";
    case 429:
      return "Zbyt wiele zapytań. Spróbuj ponownie później.";
    case 500:
      return "Błąd serwera. Spróbuj ponownie później.";
    default:
      return fallbackMessage;
  }
}

export function getProjectLoadErrorMessage(error) {
  const status = getApiStatus(error);
  if (status === 403) return "Brak dostępu do tej decyzji (odmowa dostępu).";
  if (status === 404) return "Decyzja nie istnieje lub została usunięta.";
  if (status === 410) return "Ten link wygasł.";

  return getApiErrorMessage(error, "Nie udało się wczytać projektu.");
}
