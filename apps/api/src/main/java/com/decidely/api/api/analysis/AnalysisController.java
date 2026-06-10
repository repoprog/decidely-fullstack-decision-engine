package com.decidely.api.api.analysis;

import com.decidely.api.api.analysis.dto.table.TableAnalysisRequest;
import com.decidely.api.api.analysis.dto.table.TableAnalysisResultDTO;
import com.decidely.api.api.analysis.dto.tree.TreeAnalysisRequest;
import com.decidely.api.api.analysis.dto.tree.TreeAnalysisResultDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analysis")
@RequiredArgsConstructor
public class AnalysisController {

    private final TreeEvaluationService treeEvaluationService;
    private final TableEvaluationService tableEvaluationService;

    @PostMapping("/tree")
    public ResponseEntity<TreeAnalysisResultDTO> analyzeTree(
            @Valid
            @RequestBody
            TreeAnalysisRequest request) {
        return ResponseEntity.ok(treeEvaluationService.evaluate(request));
    }

    @PostMapping("/table")
    public ResponseEntity<TableAnalysisResultDTO> analyzeTable(
            @Valid
            @RequestBody
            TableAnalysisRequest request) {
        return ResponseEntity.ok(tableEvaluationService.evaluate(request));
    }
}