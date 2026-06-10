import React, { memo } from "react";
import { Users, Database, FileText, Link as LinkIcon } from "lucide-react";
import { Card } from "../../../components/ui/Card";

const StatSkeleton = ({ wide = false }) => (
  <div
    className={`h-10 ${wide ? "w-24" : "w-16"} bg-muted animate-pulse rounded z-10`}
  />
);

const StatCard = memo(function StatCard({
  label,
  valueNode,
  icon: Icon,
  iconColor,
  hoverColor,
  isLoading,
  wideSkeleton,
}) {
  return (
    <Card
      className={`flex flex-col gap-2 relative overflow-hidden group transition-colors ${hoverColor}`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className={`w-16 h-16 ${iconColor}`} />
      </div>
      <p className="text-sm font-medium text-muted-foreground z-10">{label}</p>
      {isLoading ? (
        <StatSkeleton wide={wideSkeleton} />
      ) : (
        <div className="z-10">{valueNode}</div>
      )}
    </Card>
  );
});

export const AdminStatsCards = memo(function AdminStatsCards({
  stats = {},
  isLoading,
}) {
  const cards = [
    {
      label: "Użytkownicy",
      valueNode: <p className="text-4xl font-bold">{stats.totalUsers ?? 0}</p>,
      icon: Users,
      iconColor: "text-primary",
      hoverColor: "hover:border-primary/50",
      wideSkeleton: false,
    },
    {
      label: "Projekty ogółem",
      valueNode: (
        <p className="text-4xl font-bold">{stats.totalProjects ?? 0}</p>
      ),
      icon: Database,
      iconColor: "text-primary",
      hoverColor: "hover:border-primary/50",
      wideSkeleton: false,
    },
    {
      label: "Tabele / Drzewa",
      valueNode: (
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{stats.totalTables ?? 0}</span>
          <span className="text-xl text-muted-foreground">/</span>
          <span className="text-4xl font-bold text-feature-tree">
            {stats.totalTrees}
          </span>
        </div>
      ),
      icon: FileText,
      iconColor: "text-feature-table",
      hoverColor: "hover:border-feature-table/50",
      wideSkeleton: true,
    },
    {
      label: "Aktywne Udostępnienia",
      valueNode: (
        <p className="text-4xl font-bold">{stats.activeShareLinks ?? 0}</p>
      ),
      icon: LinkIcon,
      iconColor: "text-green-500",
      hoverColor: "hover:border-green-500/50",
      wideSkeleton: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} isLoading={isLoading} />
      ))}
    </div>
  );
});
