package com.logwise.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.logwise.entity.ErrorHistory;
import com.logwise.repository.ErrorHistoryRepository;
import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import io.netty.handler.ssl.util.InsecureTrustManagerFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import javax.net.ssl.SSLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class SplunkMCPService {

    @Value("${splunk.host}")
    private String splunkHost;

    @Value("${splunk.hec.token}")
    private String splunkHecToken;

    @Value("${splunk.mcp.token}")
    private String splunkMcpToken;

    @Value("${splunk.mcp.url}")
    private String splunkMcpUrl;

    @Autowired
    private ErrorHistoryRepository errorHistoryRepository;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public SplunkMCPService(ObjectMapper objectMapper) throws SSLException {
        this.objectMapper = objectMapper;
        SslContext sslContext = SslContextBuilder.forClient()
                .trustManager(InsecureTrustManagerFactory.INSTANCE).build();
        HttpClient httpClient = HttpClient.create()
                .secure(t -> t.sslContext(sslContext))
                .followRedirect(true);
        this.webClient = WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient)).build();
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /** Index log in Splunk via HEC */
    public void indexLog(String logContent, String source) {
        try {
            webClient.post()
                    .uri("https://" + splunkHost + ":8088/services/collector/event")
                    .header("Authorization", "Splunk " + splunkHecToken)
                    .header("Content-Type", "application/json")
                    .bodyValue(Map.of(
                            "event", logContent,
                            "source", source,
                            "sourcetype", "logwise_analysis",
                            "index", "main"))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            log.info("Log indexed in Splunk successfully");
        } catch (Exception e) {
            log.warn("Could not index log in Splunk: {}", e.getMessage());
        }
    }

    /** Search error history via Splunk MCP, fallback to H2 */
    public SplunkContext searchErrorHistory(String errorType) {
        String errorKey = truncate(errorType.replaceAll("\\s+", " ").trim(), 100);
        try {
            mcpInit(1);
            String keyword = errorKey.split("[:\\s\\.]+")[0].trim();
            String spl = "search index=main sourcetype=logwise_analysis \"" + keyword + "\" " +
                    "| stats count as occurrences, min(_time) as first_seen, max(_time) as last_seen " +
                    "| eval first_seen=strftime(first_seen, \"%Y-%m-%d %H:%M\"), " +
                    "last_seen=strftime(last_seen, \"%Y-%m-%d %H:%M\")";

            String response = mcpQuery(spl, "-7d", 3);
            SplunkContext result = parseSplunkContext(response);

            if (!result.found()) return searchHistoryFromH2(errorKey);
            updateH2History(errorKey);
            return result;

        } catch (Exception e) {
            log.warn("Splunk MCP history failed, using H2 fallback: {}", e.getMessage());
            return searchHistoryFromH2(errorKey);
        }
    }

    /** Find similar past incidents via Splunk MCP */
    public List<SimilarIncident> findSimilarIncidents(String errorType) {
        try {
            mcpInit(10);
            String mainError = errorType.trim().split("\n")[0].split("[:\\s\\.]+")[0].trim();
            String spl = "search index=main sourcetype=logwise_incident (\"" + mainError +
                    "\" OR \"null\" OR \"exception\") | head 3";

            String response = mcpQuery(spl, "-30d", 11);
            return parseSimilarIncidents(response);

        } catch (Exception e) {
            log.warn("Could not find similar incidents: {}", e.getMessage());
            return List.of();
        }
    }

    /** Get incident replay timeline via Splunk MCP */
    public List<TimelineEvent> getIncidentTimeline(String errorType) {
        try {
            String errorKey = detectErrorType(errorType);
            log.info("Timeline error key: {}", errorKey);
            mcpInit(20);
            String spl = "search index=main sourcetype=logwise_timeline error_type=\"" + errorKey +
                    "\" | sort timestamp | fields timestamp, level, service, event_description, impact";

            String response = mcpQuery(spl, "-3650d", 21);
            return parseTimeline(response);

        } catch (Exception e) {
            log.warn("Could not get timeline: {}", e.getMessage());
            return List.of();
        }
    }

    // ── MCP helpers ───────────────────────────────────────────────────────────

    private void mcpInit(int id) {
        webClient.post()
                .uri(splunkMcpUrl)
                .header("Authorization", "Bearer " + splunkMcpToken)
                .header("Content-Type", "application/json")
                .bodyValue(Map.of("jsonrpc", "2.0", "id", id, "method", "initialize",
                        "params", Map.of("client", "logwise", "version", "1.0")))
                .retrieve().bodyToMono(String.class).block();
    }

    private String mcpQuery(String spl, String earliestTime, int id) {
        String response = webClient.post()
                .uri(splunkMcpUrl)
                .header("Authorization", "Bearer " + splunkMcpToken)
                .header("Content-Type", "application/json")
                .bodyValue(Map.of(
                        "jsonrpc", "2.0", "id", id + 1,
                        "method", "tools/call",
                        "params", Map.of(
                                "name", "splunk_run_query",
                                "arguments", Map.of(
                                        "query", spl,
                                        "earliest_time", earliestTime,
                                        "latest_time", "now",
                                        "row_limit", 10))))
                .retrieve().bodyToMono(String.class).block();
        return response;
    }

    // ── Parsers ───────────────────────────────────────────────────────────────

    private SplunkContext parseSplunkContext(String response) {
        try {
            JsonNode results = objectMapper.readTree(response)
                    .path("result").path("structuredContent").path("results");
            if (results.isArray() && !results.isEmpty()) {
                JsonNode first = results.get(0);
                int occ = first.path("occurrences").asInt(0);
                if (occ > 0) {
                    log.info("Splunk MCP found {} occurrences", occ);
                    return new SplunkContext(occ,
                            first.path("first_seen").asText("N/A"),
                            first.path("last_seen").asText("N/A"), true);
                }
            }
        } catch (Exception e) {
            log.warn("Could not parse Splunk context: {}", e.getMessage());
        }
        return SplunkContext.empty();
    }

    private List<SimilarIncident> parseSimilarIncidents(String response) {
        try {
            JsonNode results = objectMapper.readTree(response)
                    .path("result").path("structuredContent").path("results");
            if (!results.isArray()) return List.of();
            List<SimilarIncident> list = new ArrayList<>();
            for (JsonNode node : results) {
                String raw = node.path("_raw").asText("");
                if (!raw.isBlank()) {
                    try {
                        JsonNode evt = objectMapper.readTree(raw);
                        list.add(new SimilarIncident(
                                evt.path("error").asText("Unknown error"),
                                evt.path("cause").asText("Unknown cause"),
                                evt.path("solution").asText("No solution recorded"),
                                evt.path("resolution_time_minutes").asInt(0),
                                evt.path("severity").asText("Unknown"),
                                evt.path("date").asText("Unknown")));
                    } catch (Exception ignored) {}
                }
            }
            return list;
        } catch (Exception e) {
            log.warn("Could not parse similar incidents: {}", e.getMessage());
            return List.of();
        }
    }

    private List<TimelineEvent> parseTimeline(String response) {
        try {
            JsonNode results = objectMapper.readTree(response)
                    .path("result").path("structuredContent").path("results");
            if (!results.isArray()) return List.of();
            List<TimelineEvent> list = new ArrayList<>();
            for (JsonNode node : results) {
                list.add(new TimelineEvent(
                        node.path("timestamp").asText(""),
                        node.path("level").asText("INFO"),
                        node.path("service").asText(""),
                        node.path("event_description").asText(""),
                        node.path("impact").asText("Low")));
            }
            return list;
        } catch (Exception e) {
            log.warn("Could not parse timeline: {}", e.getMessage());
            return List.of();
        }
    }

    // ── H2 fallback ───────────────────────────────────────────────────────────

    private SplunkContext searchHistoryFromH2(String errorKey) {
        try {
            Optional<ErrorHistory> existing = errorHistoryRepository.findByErrorKey(errorKey);
            if (existing.isPresent()) {
                ErrorHistory h = existing.get();
                h.setOccurrences(h.getOccurrences() + 1);
                h.setLastSeen(LocalDateTime.now());
                errorHistoryRepository.save(h);
                log.info("H2 fallback: {} seen {} times", errorKey, h.getOccurrences());
                return new SplunkContext(h.getOccurrences(),
                        h.getFirstSeen().format(FORMATTER),
                        h.getLastSeen().format(FORMATTER), true);
            } else {
                ErrorHistory h = new ErrorHistory();
                h.setErrorKey(errorKey);
                h.setOccurrences(1);
                h.setFirstSeen(LocalDateTime.now());
                h.setLastSeen(LocalDateTime.now());
                errorHistoryRepository.save(h);
                return SplunkContext.empty();
            }
        } catch (Exception e) {
            log.warn("H2 fallback failed: {}", e.getMessage());
            return SplunkContext.empty();
        }
    }

    private void updateH2History(String errorKey) {
        try {
            Optional<ErrorHistory> existing = errorHistoryRepository.findByErrorKey(errorKey);
            if (existing.isPresent()) {
                ErrorHistory h = existing.get();
                h.setOccurrences(h.getOccurrences() + 1);
                h.setLastSeen(LocalDateTime.now());
                errorHistoryRepository.save(h);
            } else {
                ErrorHistory h = new ErrorHistory();
                h.setErrorKey(errorKey); h.setOccurrences(1);
                h.setFirstSeen(LocalDateTime.now()); h.setLastSeen(LocalDateTime.now());
                errorHistoryRepository.save(h);
            }
        } catch (Exception e) {
            log.warn("Could not update H2: {}", e.getMessage());
        }
    }

    // ── Utility ───────────────────────────────────────────────────────────────

    private String detectErrorType(String errorType) {
        String lower = errorType.toLowerCase();
        if (lower.contains("nullpointer")) return "NullPointerException";
        if (lower.contains("timeout") || lower.contains("connection") || lower.contains("pool")) return "ConnectionTimeout";
        if (lower.contains("outofmemory") || lower.contains("heap")) return "OutOfMemoryError";
        return "NullPointerException";
    }

    private String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max);
    }

    // ── Records ───────────────────────────────────────────────────────────────

    public record SplunkContext(int occurrences, String firstSeen, String lastSeen, boolean found) {
        public static SplunkContext empty() { return new SplunkContext(0, "N/A", "N/A", false); }
        public String toPromptContext() {
            if (!found || occurrences == 0) return "No previous occurrences of this error found in Splunk history.";
            return String.format("Splunk MCP shows this error appeared %d time(s). First seen: %s. Last seen: %s.",
                    occurrences, firstSeen, lastSeen);
        }
    }

    public record SimilarIncident(String error, String cause, String solution,
                                   int resolutionTimeMinutes, String severity, String date) {}

    public record TimelineEvent(String timestamp, String level, String service,
                                 String eventDescription, String impact) {}
}
