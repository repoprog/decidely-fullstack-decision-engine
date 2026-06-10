package com.decidely.api.api.admin.dto;

public interface SystemStatsDTO {
    Long getTotalUsers();

    Long getTotalProjects();

    Long getProjectsByTypeTree();

    Long getProjectsByTypeTable();

    Long getActiveShareLinks();
}