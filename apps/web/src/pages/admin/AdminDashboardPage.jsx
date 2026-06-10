import React, { useCallback, useEffect, useState } from "react";
import { Shield } from "lucide-react";
import {
  getActiveSharesPage,
  getSystemStats,
  getUsersPage,
  revokeShare,
  toggleUserStatus,
} from "../../api/adminApi";
import { getApiErrorMessage } from "../../api/apiError";
import { useToastStore } from "../../store/useToastStore";
import { AdminStatsCards } from "./components/AdminStatsCards";
import { AdminUsersTable } from "./components/AdminUsersTable";
import { AdminSharesTable } from "./components/AdminSharesTable";

const PAGE_SIZE = 10;

const INITIAL_STATS = {
  totalUsers: 0,
  totalProjects: 0,
  totalTables: 0,
  totalTrees: 0,
  activeShareLinks: 0,
};

const EMPTY_PAGE = {
  content: [],
  totalPages: 0,
};

export function AdminDashboardPage() {
  const addToast = useToastStore((state) => state.addToast);

  const [stats, setStats] = useState(INITIAL_STATS);
  const [usersData, setUsersData] = useState(EMPTY_PAGE);
  const [sharesData, setSharesData] = useState(EMPTY_PAGE);

  const [userPage, setUserPage] = useState(0);
  const [sharePage, setSharePage] = useState(0);

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingShares, setIsLoadingShares] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);

      const data = await getSystemStats();

      setStats({
        totalUsers: data?.totalUsers || 0,
        totalProjects: data?.totalProjects || 0,
        totalTables: data?.projectsByTypeTable || 0,
        totalTrees: data?.projectsByTypeTree || 0,
        activeShareLinks: data?.activeShareLinks || 0,
      });
    } catch (error) {
      addToast(
        getApiErrorMessage(error, "Nie udało się pobrać statystyk systemu."),
        "error",
      );
    } finally {
      setIsLoadingStats(false);
    }
  }, [addToast]);

  const loadUsers = useCallback(
    async (pageIndex) => {
      try {
        setIsLoadingUsers(true);

        const data = await getUsersPage(pageIndex, PAGE_SIZE);

        setUsersData({
          content: data?.content || [],
          totalPages: data?.totalPages || 0,
        });
      } catch (error) {
        addToast(
          getApiErrorMessage(error, "Nie udało się pobrać listy użytkowników."),
          "error",
        );
      } finally {
        setIsLoadingUsers(false);
      }
    },
    [addToast],
  );

  const loadShares = useCallback(
    async (pageIndex) => {
      try {
        setIsLoadingShares(true);

        const data = await getActiveSharesPage(pageIndex, PAGE_SIZE);

        setSharesData({
          content: data?.content || [],
          totalPages: data?.totalPages || 0,
        });
      } catch (error) {
        addToast(
          getApiErrorMessage(
            error,
            "Nie udało się pobrać aktywnych udostępnień.",
          ),
          "error",
        );
      } finally {
        setIsLoadingShares(false);
      }
    },
    [addToast],
  );

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadUsers(userPage);
  }, [loadUsers, userPage]);

  useEffect(() => {
    loadShares(sharePage);
  }, [loadShares, sharePage]);

  const handleToggleUserStatus = async (user) => {
    if (user.role === "ADMIN") {
      return;
    }

    try {
      await toggleUserStatus(user.id);

      addToast(`Status użytkownika ${user.email} został zmieniony.`, "success");
      loadUsers(userPage);
    } catch (error) {
      addToast(
        getApiErrorMessage(error, "Nie udało się zmienić statusu użytkownika."),
        "error",
      );
    }
  };

  const handleRevokeShare = async (shareId) => {
    try {
      await revokeShare(shareId);

      addToast("Link udostępniający został usunięty.", "success");

      setStats((prev) => ({
        ...prev,
        activeShareLinks: Math.max(0, prev.activeShareLinks - 1),
      }));

      loadShares(sharePage);
    } catch (error) {
      addToast(
        getApiErrorMessage(
          error,
          "Nie udało się usunąć linku udostępniającego.",
        ),
        "error",
      );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">
          Panel Administratora
        </h1>
      </div>

      <AdminStatsCards stats={stats} isLoading={isLoadingStats} />

      <div className="grid grid-cols-1 gap-10">
        <AdminUsersTable
          users={usersData.content}
          isLoading={isLoadingUsers}
          onToggleStatus={handleToggleUserStatus}
          currentPage={userPage}
          totalPages={usersData.totalPages}
          onPageChange={setUserPage}
        />

        <AdminSharesTable
          shares={sharesData.content}
          isLoading={isLoadingShares}
          onRevoke={handleRevokeShare}
          currentPage={sharePage}
          totalPages={sharesData.totalPages}
          onPageChange={setSharePage}
        />
      </div>
    </div>
  );
}
