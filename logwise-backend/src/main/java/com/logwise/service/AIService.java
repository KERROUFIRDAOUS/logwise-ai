package com.logwise.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.logwise.dto.AnalyzeResponse;
import com.logwise.dto.ResolutionPrediction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class AIService {

    @Value("${ai.api.key}")
    private String apiKey;

    @Value("${ai.api.url}")
    private String apiUrl;

    @Value("${ai.api.model}")
    private String model;

    @Value("${ai.api.max-tokens}")
    private int maxTokens;

    private final ObjectMapper objectMapper;
    private final SplunkMCPService splunkMCPService;
    private final ResolutionPredictorService resolutionPredictorService;

    // Single shared WebClient instance
    private final WebClient webClient = WebClient.builder().build();

    // ── Public API ──────────────────────────────────────────────────────────

    public AnalyzeResponse analyze(String logContent) {
        // 1. Index log in Splunk
        splunkMCPService.indexLog(logContent, "logwise-ui");

        // 2. Fetch Splunk data in parallel logical steps
        String errorType = extractErrorType(logContent);
        SplunkMCPService.SplunkContext splunkContext = splunkMCPService.searchErrorHistory(errorType);
        List<SplunkMCPService.SimilarIncident> similarIncidents = splunkMCPService.findSimilarIncidents(logContent);
        List<SplunkMCPService.TimelineEvent> timeline = splunkMCPService.getIncidentTimeline(logContent);

        // 3. Build AI prompt enriched with Splunk context
        String prompt = buildEnrichedPrompt(logContent, splunkContext);

        try {
            // 4. Call AI
            String aiResponse = callAI(prompt, maxTokens);
            AnalyzeResponse result = parseAnalyzeResponse(aiResponse);

            // 5. Predict resolution (needs real severity from AI response)
            ResolutionPrediction prediction = resolutionPredictorService.predict(
                    result.getSeverity(), similarIncidents, splunkContext);

            // 6. Enrich response
            result.setResolutionPrediction(prediction);
            result.setSplunkContext(splunkContext.toPromptContext());
            result.setSimilarIncidents(similarIncidents);
            result.setTimeline(timeline);

            log.info("Analysis complete — severity: {}, splunk occurrences: {}",
                    result.getSeverity(), splunkContext.occurrences());

            return result;

        } catch (Exception e) {
            log.error("AI analysis failed: {}", e.getMessage());
            throw new RuntimeException("Failed to analyze logs: " + e.getMessage());
        }
    }

    public String chatWithIncident(String question, String incidentContext) {
        String prompt = """
            You are LogWise, an expert developer assistant analyzing a specific incident.
            
            INCIDENT CONTEXT:
            %s
            
            QUESTION: %s
            
            Answer concisely based only on the incident context above.
            Respond in the same language as the question (French or English).
            """.formatted(incidentContext, question);

        try {
            return callAI(prompt, 500);
        } catch (Exception e) {
            log.error("Chat failed: {}", e.getMessage());
            return "Sorry, I couldn't process your question.";
        }
    }

    public String generateActionPlan(String incidentContext) {
        String prompt = """
            You are LogWise, an expert DevOps assistant.
            Generate a precise 5-step action plan based on this incident context.
            
            Respond ONLY with a JSON array (no markdown, no backticks):
            [
              { "step": 1, "action": "...", "duration": "X min", "priority": "immediate|high|medium" },
              { "step": 2, "action": "...", "duration": "X min", "priority": "immediate|high|medium" },
              { "step": 3, "action": "...", "duration": "X min", "priority": "immediate|high|medium" },
              { "step": 4, "action": "...", "duration": "X min", "priority": "immediate|high|medium" },
              { "step": 5, "action": "...", "duration": "X min", "priority": "immediate|high|medium" }
            ]
            
            Incident context:
            %s
            """.formatted(incidentContext);

        try {
            return callAI(prompt, 500);
        } catch (Exception e) {
            log.error("Action plan failed: {}", e.getMessage());
            return "[]";
        }
    }

    public String generateIncidentReport(String incidentContext) {
        String prompt = """
            You are LogWise, an expert DevOps assistant.
            Generate a professional post-incident report based on this context.
            
            Respond ONLY with valid JSON (no markdown, no backticks):
            {
              "title": "Incident Report — [error type]",
              "date": "today's date",
              "severity": "Critical|High|Medium|Low",
              "summary": "2-3 sentences executive summary",
              "rootCause": "detailed root cause analysis",
              "timeline": [{ "time": "HH:MM", "event": "what happened" }],
              "fixApplied": "what was done to fix it",
              "lessonsLearned": ["lesson 1", "lesson 2", "lesson 3"],
              "preventionSteps": ["step 1", "step 2", "step 3"]
            }
            
            Incident context:
            %s
            """.formatted(incidentContext);

        try {
            return callAI(prompt, 800);
        } catch (Exception e) {
            log.error("Incident report failed: {}", e.getMessage());
            return "{}";
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private String callAI(String prompt, int maxTokens) {
        Map<String, Object> body = Map.of(
                "model", model,
                "max_tokens", maxTokens,
                "messages", List.of(Map.of("role", "user", "content", prompt))
        );
        String response = webClient.post()
                .uri(apiUrl)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            JsonNode root = objectMapper.readTree(response);
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage());
        }
    }

    private String buildEnrichedPrompt(String logContent, SplunkMCPService.SplunkContext ctx) {
        return """
            You are LogWise, an expert log analysis engine.
            
            SPLUNK HISTORICAL CONTEXT:
            %s
            
            Analyze the following log/error/stacktrace and respond ONLY with valid JSON (no markdown, no backticks):
            {
              "cause": "one sentence describing the probable root cause",
              "explanation": "2-3 sentences explaining what happened in simple terms for a junior dev",
              "severity": "Critical | High | Medium | Low",
              "severity_reason": "one sentence explaining why this severity level",
              "fixes": ["fix 1", "fix 2", "fix 3"]
            }
            
            Log to analyze:
            %s
            """.formatted(ctx.toPromptContext(), logContent);
    }

    private String extractErrorType(String logContent) {
        String firstLine = logContent.lines()
                .filter(l -> !l.isBlank())
                .findFirst()
                .orElse(logContent);
        return firstLine.substring(0, Math.min(100, firstLine.length()));
    }

    private AnalyzeResponse parseAnalyzeResponse(String content) throws Exception {
        String cleanJson = content.replaceAll("```json|```", "").trim();
        JsonNode result = objectMapper.readTree(cleanJson);

        AnalyzeResponse response = new AnalyzeResponse();
        response.setCause(result.path("cause").asText());
        response.setExplanation(result.path("explanation").asText());
        response.setSeverity(result.path("severity").asText());
        response.setSeverityReason(result.path("severity_reason").asText());
        response.setFixes(objectMapper.convertValue(
                result.path("fixes"),
                objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
        ));
        return response;
    }
}
