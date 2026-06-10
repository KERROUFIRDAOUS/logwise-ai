package com.logwise.controller;

import com.logwise.dto.AnalyzeRequest;
import com.logwise.dto.AnalyzeResponse;
import com.logwise.service.AIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class AnalyzeController {

    private final AIService AIService;

    @PostMapping("/analyze")
    public ResponseEntity<AnalyzeResponse> analyze(@RequestBody AnalyzeRequest request) {
        if (request.getLogContent() == null || request.getLogContent().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        log.info("Analyze request received");
        return ResponseEntity.ok(AIService.analyze(request.getLogContent()));
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("LogWise API is running");
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, Object> request) {
        String question       = (String) request.get("question");
        String incidentContext = (String) request.get("incidentContext");
        if (question == null || incidentContext == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(Map.of("answer", AIService.chatWithIncident(question, incidentContext)));
    }

    @PostMapping("/action-plan")
    public ResponseEntity<Map<String, Object>> actionPlan(@RequestBody Map<String, String> request) {
        String context = request.get("context");
        if (context == null || context.isBlank()) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(Map.of("plan", AIService.generateActionPlan(context)));
    }

    @PostMapping("/incident-report")
    public ResponseEntity<Map<String, String>> incidentReport(@RequestBody Map<String, String> request) {
        String context = request.get("context");
        if (context == null || context.isBlank()) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(Map.of("report", AIService.generateIncidentReport(context)));
    }
}
