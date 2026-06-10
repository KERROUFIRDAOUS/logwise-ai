package com.logwise.controller;

import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import io.netty.handler.ssl.util.InsecureTrustManagerFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.util.List;
import java.util.Map;

/**
 * SeederController — only active with profile "demo" or "dev"
 * Used to seed Splunk with test data for hackathon demonstration.
 * DO NOT enable in production.
 */
@RestController
@RequestMapping("/api")
@Profile({"demo", "dev", "default"})
@Slf4j
public class SeederController {

    @Value("${splunk.host}")
    private String splunkHost;

    @Value("${splunk.hec.token}")
    private String splunkHecToken;

    private WebClient buildWebClient() throws Exception {
        SslContext sslContext = SslContextBuilder.forClient()
                .trustManager(InsecureTrustManagerFactory.INSTANCE).build();
        HttpClient httpClient = HttpClient.create().secure(t -> t.sslContext(sslContext));
        return WebClient.builder().clientConnector(new ReactorClientHttpConnector(httpClient)).build();
    }

    private void sendToSplunk(WebClient webClient, List<Map<String, Object>> events) throws InterruptedException {
        String hecUrl = "https://" + splunkHost + ":8088/services/collector/event";
        for (Map<String, Object> event : events) {
            webClient.post()
                    .uri(hecUrl)
                    .header("Authorization", "Splunk " + splunkHecToken)
                    .header("Content-Type", "application/json")
                    .bodyValue(event)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            Thread.sleep(200);
        }
    }

    @GetMapping("/seed-incidents")
    public ResponseEntity<String> seedIncidents() throws Exception {
        log.info("Seeding incidents into Splunk...");
        WebClient webClient = buildWebClient();
        sendToSplunk(webClient, List.of(
            Map.of("event", Map.of("type","incident","error","NullPointerException","service","UserService",
                "cause","User object null due to failed DB query",
                "solution","Added null check before getEmail() call. Verified DB query returns Optional<User>.",
                "resolution_time_minutes",15,"severity","High","date","2026-05-15"),
                "sourcetype","logwise_incident","index","main"),
            Map.of("event", Map.of("type","incident","error","Connection timeout PostgreSQL","service","AuthorizationService",
                "cause","Connection pool exhausted under high load",
                "solution","Increased maxPoolSize from 10 to 50 in application.properties. Added connection timeout handling.",
                "resolution_time_minutes",30,"severity","Critical","date","2026-05-20"),
                "sourcetype","logwise_incident","index","main"),
            Map.of("event", Map.of("type","incident","error","EmptyResultDataAccessException","service","AuthorizationService",
                "cause","getById() throws exception when entity not found",
                "solution","Replaced getById() with findById() which returns Optional. Added proper error handling.",
                "resolution_time_minutes",20,"severity","High","date","2026-05-22"),
                "sourcetype","logwise_incident","index","main"),
            Map.of("event", Map.of("type","incident","error","OutOfMemoryError Java heap space","service","NotificationService",
                "cause","Memory leak in email template rendering",
                "solution","Fixed template engine configuration. Added -Xmx2g JVM flag. Optimized object lifecycle.",
                "resolution_time_minutes",45,"severity","Critical","date","2026-05-25"),
                "sourcetype","logwise_incident","index","main"),
            Map.of("event", Map.of("type","incident","error","HttpClientErrorException 401 Unauthorized","service","CCMService",
                "cause","JWT token expired before request completion",
                "solution","Implemented token refresh mechanism. Reduced token TTL check interval to 5 minutes.",
                "resolution_time_minutes",10,"severity","Medium","date","2026-05-28"),
                "sourcetype","logwise_incident","index","main"),
            Map.of("event", Map.of("type","incident","error","LazyInitializationException Hibernate","service","DocumentService",
                "cause","Hibernate session closed before lazy collection initialized",
                "solution","Added @Transactional on service method. Changed fetch type to EAGER for Document.attachments.",
                "resolution_time_minutes",25,"severity","High","date","2026-06-01"),
                "sourcetype","logwise_incident","index","main")
        ));
        return ResponseEntity.ok("6 incidents seeded in Splunk!");
    }

    @GetMapping("/seed-timeline-v3")
    public ResponseEntity<String> seedTimeline() throws Exception {
        log.info("Seeding NullPointerException timeline into Splunk...");
        WebClient webClient = buildWebClient();
        sendToSplunk(webClient, List.of(
            Map.of("event", Map.of("type","timeline_event","error_type","NullPointerException",
                "timestamp","2026-06-07T14:01:00","level","WARN","service","AuthorizationService",
                "event_description","Database response time increased to 800ms — queries slowing down","impact","Low"),
                "sourcetype","logwise_timeline","index","main"),
            Map.of("event", Map.of("type","timeline_event","error_type","NullPointerException",
                "timestamp","2026-06-07T14:03:00","level","WARN","service","AuthorizationController",
                "event_description","API response time degraded — timeout threshold approaching 30s","impact","Medium"),
                "sourcetype","logwise_timeline","index","main"),
            Map.of("event", Map.of("type","timeline_event","error_type","NullPointerException",
                "timestamp","2026-06-07T14:05:00","level","ERROR","service","NotificationService",
                "event_description","First NullPointerException — user object null on getEmail()","impact","High"),
                "sourcetype","logwise_timeline","index","main"),
            Map.of("event", Map.of("type","timeline_event","error_type","NullPointerException",
                "timestamp","2026-06-07T14:07:00","level","ERROR","service","AuthorizationService",
                "event_description","Error rate spike — 45 NullPointerExceptions per minute","impact","High"),
                "sourcetype","logwise_timeline","index","main"),
            Map.of("event", Map.of("type","timeline_event","error_type","NullPointerException",
                "timestamp","2026-06-07T14:09:00","level","CRITICAL","service","NotificationService",
                "event_description","Service unavailable — authorization emails completely blocked","impact","Critical"),
                "sourcetype","logwise_timeline","index","main")
        ));
        return ResponseEntity.ok("5 timeline events seeded!");
    }
}
