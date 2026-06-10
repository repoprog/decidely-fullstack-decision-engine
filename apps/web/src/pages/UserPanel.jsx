import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Camera,
  Edit2,
  ExternalLink,
  Filter,
  MessageSquare,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import { decisionApi } from "../api/decisionApi";
import { getApiErrorMessage } from "../api/apiError";
import { ConfirmModal } from "../components/modals/ConfirmModal";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useTableStore } from "../features/DecisionTable/store/useTableStore";
import { useTreeStore } from "../features/DecisionTree/store/useTreeStore";
import { useToastStore } from "../store/useToastStore";

const formatProjectDate = (dateValue) => {
  if (!dateValue) return "Brak daty";

  return new Date(dateValue).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getProjectTimestamp = (project) => {
  const date = project.updatedAt || project.createdAt;
  return date ? new Date(date).getTime() : 0;
};

export default function UserPanel() {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedTags, setSelectedTags] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editedNotes, setEditedNotes] = useState("");
  const [editingTags, setEditingTags] = useState(null);
  const [newTagInput, setNewTagInput] = useState("");

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    projectId: null,
  });

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);

      try {
        const data = await decisionApi.getUserProjects();
        setProjects(data);
      } catch (error) {
        addToast(
          getApiErrorMessage(error, "Nie udało się pobrać decyzji z serwera."),
          "error",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [addToast]);

  const allTags = useMemo(() => {
    return Array.from(new Set(projects.flatMap((project) => project.tags || [])));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) => {
        const normalizedSearchQuery = searchQuery.toLowerCase();

        const matchesSearch =
          project.title?.toLowerCase().includes(normalizedSearchQuery) ||
          project.notes?.toLowerCase().includes(normalizedSearchQuery);

        const matchesType = typeFilter === "ALL" || project.type === typeFilter;

        const projectTags = project.tags || [];
        const matchesTags =
          selectedTags.length === 0 ||
          selectedTags.some((tag) => projectTags.includes(tag));

        return matchesSearch && matchesType && matchesTags;
      })
      .sort((firstProject, secondProject) => {
        return (
          getProjectTimestamp(secondProject) - getProjectTimestamp(firstProject)
        );
      });
  }, [projects, searchQuery, typeFilter, selectedTags]);

  const startEditing = (project) => {
    setEditingId(project.id);
    setEditedNotes(project.notes || "");
    setEditingTags(project.tags || []);
  };

  const saveNotesAndTags = async (id) => {
    try {
      const projectToUpdate = projects.find((project) => project.id === id);

      await decisionApi.updateProjectMeta(id, {
        title: projectToUpdate.title,
        status: projectToUpdate.status,
        category: projectToUpdate.category,
        tags: editingTags,
        notes: editedNotes,
      });

      setProjects((previousProjects) =>
        previousProjects.map((project) =>
          project.id === id
            ? { ...project, notes: editedNotes, tags: editingTags }
            : project,
        ),
      );

      addToast("Zmiany zostały zapisane.", "success");
    } catch (error) {
      addToast(
        getApiErrorMessage(error, "Błąd podczas zapisywania zmian."),
        "error",
      );
    } finally {
      setEditingId(null);
      setEditingTags(null);
    }
  };

  const confirmDelete = async () => {
    try {
      await decisionApi.deleteProject(deleteModal.projectId);

      setProjects((previousProjects) =>
        previousProjects.filter(
          (project) => project.id !== deleteModal.projectId,
        ),
      );

      addToast("Decyzja została usunięta.", "success");
    } catch (error) {
      addToast(
        getApiErrorMessage(error, "Nie udało się usunąć decyzji."),
        "error",
      );
    } finally {
      setDeleteModal({ isOpen: false, projectId: null });
    }
  };

  const openProject = async (project) => {
    try {
      if (project.type === "TREE") {
        useTreeStore.getState().exitPreviewMode();
        await useTreeStore.getState().loadCloudProject(project.id);
        navigate("/app/tree");
      } else {
        useTableStore.getState().exitPreviewMode();
        await useTableStore.getState().loadCloudProject(project.id);
        navigate("/app/table");
      }
    } catch (error) {
      addToast(
        getApiErrorMessage(error, "Nie udało się otworzyć decyzji."),
        "error",
      );
    }
  };

  const toggleTagFilter = (tag) => {
    setSelectedTags((previousTags) =>
      previousTags.includes(tag)
        ? previousTags.filter((selectedTag) => selectedTag !== tag)
        : [...previousTags, tag],
    );
  };

  const addTagToEditing = () => {
    const trimmedTag = newTagInput.trim();

    if (!trimmedTag || !editingTags || editingTags.includes(trimmedTag)) {
      return;
    }

    setEditingTags([...editingTags, trimmedTag]);
    setNewTagInput("");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Panel użytkownika</h2>
          <p className="mt-1 text-muted-foreground">
            Przeglądaj i zarządzaj swoimi decyzjami
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Szukaj decyzji po tytule lub notatkach..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-lg border border-border bg-muted/30 py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setTypeFilter("ALL")}
            className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              typeFilter === "ALL"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Wszystko
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter("TABLE")}
            className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              typeFilter === "TABLE"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Tabela
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter("TREE")}
            className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              typeFilter === "TREE"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Drzewo
          </button>
        </div>
      </div>

      {allTags.length > 0 && (
        <Card className="p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Filtruj według tagów</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "active" : "interactive"}
                onClick={() => toggleTagFilter(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>

          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className="mt-3 text-xs text-muted-foreground underline transition-colors hover:text-foreground"
            >
              Wyczyść filtry tagów
            </button>
          )}
        </Card>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          Pobieranie decyzji...
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-2 border-dashed bg-muted/10 py-16 text-center shadow-none">
          <Filter className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="m-0 text-muted-foreground">
            Nie znaleziono decyzji pasujących do zapytania.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="group transition-colors hover:border-primary/50"
            >
              <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{project.title}</h3>

                    {project.type === "TABLE" ? (
                      <Badge variant="table">Tabela</Badge>
                    ) : (
                      <Badge variant="tree">Drzewo</Badge>
                    )}

                    {project.snapshotCount !== undefined && (
                      <Badge
                        variant="secondary"
                        title={`Liczba zapisanych wersji: ${project.snapshotCount}`}
                        className="flex cursor-help items-center gap-1.5 border-border/50 bg-muted/40 px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>{project.snapshotCount}</span>
                      </Badge>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatProjectDate(project.updatedAt || project.createdAt)}
                  </div>
                </div>

                <div className="flex w-full justify-end gap-2 md:w-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openProject(project)}
                    title="Otwórz w module"
                    className="text-primary hover:bg-primary/10"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditing(project)}
                    title="Edytuj meta"
                    className="text-primary hover:bg-primary/10"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="dangerGhost"
                    size="icon"
                    onClick={() =>
                      setDeleteModal({ isOpen: true, projectId: project.id })
                    }
                    title="Usuń decyzję"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  Tagi
                </div>

                {editingId === project.id && editingTags ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {editingTags.map((tag) => (
                      <Badge key={tag} variant="primary" className="pr-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() =>
                            setEditingTags(
                              editingTags.filter(
                                (currentTag) => currentTag !== tag,
                              ),
                            )
                          }
                          className="ml-1 rounded-full p-0.5 transition-colors hover:bg-primary/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}

                    <div className="ml-2 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(event) =>
                          setNewTagInput(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addTagToEditing();
                          }
                        }}
                        placeholder="Dodaj tag..."
                        className="w-32 rounded-full border border-border bg-background px-3 py-1.5 text-sm outline-none transition-colors focus:border-primary"
                      />

                      <button
                        type="button"
                        onClick={addTagToEditing}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                        title="Dodaj"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {project.tags && project.tags.length > 0 ? (
                      project.tags.map((tag) => (
                        <Badge key={tag} variant="default">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm italic text-muted-foreground">
                        Brak tagów
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  Notatki
                </div>

                {editingId === project.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editedNotes}
                      onChange={(event) => setEditedNotes(event.target.value)}
                      className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                      rows={3}
                      placeholder="Dodaj przemyślenia dotyczące tej decyzji..."
                    />

                    <div className="flex gap-2">
                      <Button onClick={() => saveNotesAndTags(project.id)}>
                        Zapisz zmiany
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditingId(null);
                          setEditingTags(null);
                          setNewTagInput("");
                        }}
                      >
                        Anuluj
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-lg bg-muted/20 p-4 text-sm leading-relaxed text-foreground">
                    {project.notes || (
                      <span className="italic text-muted-foreground opacity-70">
                        Brak notatek. Kliknij ikonę ołówka, aby dodać.
                      </span>
                    )}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, projectId: null })}
        onConfirm={confirmDelete}
        title="Usuwanie decyzji"
        message="Czy na pewno chcesz usunąć tę decyzję? Ta operacja jest nieodwracalna."
        variant="danger"
        confirmText="Usuń decyzję"
      />
    </div>
  );
}