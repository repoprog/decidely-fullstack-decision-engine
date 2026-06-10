package com.decidely.api.api.project;

import com.decidely.api.api.project.dto.ProjectDetailDTO;
import com.decidely.api.api.project.dto.ProjectSummaryDTO;
import com.decidely.api.domain.project.Project;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProjectMapper {
    ProjectSummaryDTO toSummaryDto(Project project);

    ProjectDetailDTO toDetailDto(Project project);
}