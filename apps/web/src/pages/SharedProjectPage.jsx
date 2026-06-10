import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Calculator, Eye, TableProperties, Trophy } from "lucide-react";
import { decisionApi } from "../api/decisionApi";
import { getApiErrorMessage, getApiStatus } from "../api/apiError";
import { Button } from "../components/ui/Button";
import { APP_ROUTES } from "../constants/appConstants";
import { TableGrid } from "../features/DecisionTable/components/TableGrid";
import { TreeCanvas } from "../features/DecisionTree/components/TreeCanvas";
import useAuthStore from "../store/useAuthStore";
import { evaluateAndSetWinningPath } from "../features/DecisionTree/logic/treeAlgorithms";

const parseProjectContent = (rawContent) => {
  if (typeof rawContent !== "string") {
    return rawContent || {};
  }

  try {
    return JSON.parse(rawContent);
  } catch {
    return {};
  }
};

const getSharedProjectErrorMessage = (error) => {
  const status = getApiStatus(error);

  if (status === 410) {
    return "Ten link wygasł.";
  }

  if (status === 404) {
    return "Nie znaleziono projektu.";
  }

  return getApiErrorMessage(
    error,
    "Nie udało się wczytać udostępnionego projektu.",
  );
};

export function SharedProjectPage() {
  const { token } = useParams();

  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isRankingView, setIsRankingView] = useState(true);
  const [isSimulationView, setIsSimulationView] = useState(false);

  const openRegisterModal = useAuthStore((state) => state.openRegisterModal);
  const setPendingRedirectPath = useAuthStore(
    (state) => state.setPendingRedirectPath,
  );

  const analyzedTreeState = useMemo(() => {
    if (project?.type !== "TREE") {
      return null;
    }

    const content = project.content || {};

    return evaluateAndSetWinningPath({
      nodes: content.nodes || [],
      edges: content.edges || [],
      evaluationMode: content.evaluationMode,
    });
  }, [project]);

 useEffect(() => {
  const abortController = new AbortController();

  const fetchProject = async () => {
    if (!token) {
      setError("Nieprawidłowy link udostępniania.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await decisionApi.getSharedProject(token, {
        signal: abortController.signal,
      });

      const content = parseProjectContent(data.content);

      setProject({
        ...data,
        content,
      });
    } catch (error) {
      if (error.name === "CanceledError" || error.name === "AbortError") {
        return;
      }

      setError(getSharedProjectErrorMessage(error));
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  fetchProject();

  return () => {
    abortController.abort();
  };
}, [token]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-background">
        <h1 className="text-2xl font-bold text-destructive">
          {error || "Nie udało się wczytać projektu."}
        </h1>

        <Link to={APP_ROUTES.HOME} className="text-primary hover:underline">
          Wróć na stronę główną
        </Link>
      </div>
    );
  }

  const isTableProject = project.type === "TABLE";
  const isTreeProject = project.type === "TREE";

  const winningPath = analyzedTreeState?.winningPath;

  const hasWinningPath =
    winningPath instanceof Set
      ? winningPath.size > 0
      : Array.isArray(winningPath) && winningPath.length > 0;

  const canShowTreeCalculations = !isTreeProject || hasWinningPath;

  const handleBuildOwnDecisionClick = () => {
    const redirectPath = isTreeProject ? APP_ROUTES.TREE : APP_ROUTES.TABLE;

    setPendingRedirectPath(redirectPath);
    openRegisterModal();
  };

  if (!isTableProject && !isTreeProject) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-background">
        <h1 className="text-2xl font-bold text-destructive">
          Nieobsługiwany typ projektu.
        </h1>

        <Link to={APP_ROUTES.HOME} className="text-primary hover:underline">
          Wróć na stronę główną
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <div className="z-50 shrink-0 border-b-2 border-primary/30 bg-primary/10 px-6 py-3 shadow-sm">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="shrink-0 rounded-lg bg-primary/20 p-2">
              <Eye className="h-5 w-5 text-primary" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  Tryb tylko do odczytu
                </span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm font-medium text-primary">
                  {project.title}
                </span>
              </div>

              <div className="text-sm text-muted-foreground">
                Zaloguj się, aby zbudować własną decyzję.
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {isTableProject && (
              <Button
                variant={isRankingView ? "amber" : "defaultAmber"}
                onClick={() => setIsRankingView((current) => !current)}
                className="h-8 px-2.5 text-xs transition-all lg:h-9 lg:px-4 lg:text-sm"
              >
                {isRankingView ? (
                  <>
                    <TableProperties className="mr-1.5 h-3.5 w-3.5 lg:mr-2 lg:h-4 lg:w-4" />
                    Pokaż surowe dane
                  </>
                ) : (
                  <>
                    <Trophy className="mr-1.5 h-3.5 w-3.5 lg:mr-2 lg:h-4 lg:w-4" />
                    Pokaż wyniki analizy
                  </>
                )}
              </Button>
            )}

            {isTreeProject && (
              <span
                title={
                  !canShowTreeCalculations
                    ? "Nie można pokazać kalkulacji, ponieważ drzewo nie ma poprawnie wyliczonej najlepszej ścieżki."
                    : undefined
                }
              >
                <Button
                  variant={isSimulationView ? "cyan" : "defaultCyan"}
                  onClick={() => setIsSimulationView((current) => !current)}
                  disabled={!canShowTreeCalculations}
                  className="h-8 px-2.5 text-xs transition-all lg:h-9 lg:px-4 lg:text-sm"
                >
                  <Calculator className="mr-1.5 h-3.5 w-3.5 lg:mr-2 lg:h-4 lg:w-4" />
                  {isSimulationView ? "Ukryj kalkulacje" : "Pokaż kalkulacje"}
                </Button>
              </span>
            )}

            <Button onClick={handleBuildOwnDecisionClick} variant="purple">
              Zbuduj własną decyzję
            </Button>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar relative w-full flex-1 overflow-y-auto bg-muted/20">
        {isTreeProject ? (
          <div className="absolute inset-4 md:inset-6 lg:inset-8">
            <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <TreeCanvas
                readOnlyData={project.content}
                readOnlySimulationMode={isSimulationView}
              />
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[1400px] p-4 md:p-8">
            <TableGrid
              readOnlyData={project.content}
              readOnlyShowRanking={isRankingView}
            />
          </div>
        )}
      </div>
    </div>
  );
}
