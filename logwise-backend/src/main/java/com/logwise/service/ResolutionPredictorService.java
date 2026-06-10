package com.logwise.service;

import com.logwise.dto.ResolutionPrediction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class ResolutionPredictorService {

    public ResolutionPrediction predict(
            String severity,
            List<SplunkMCPService.SimilarIncident> similarIncidents,
            SplunkMCPService.SplunkContext splunkContext) {

        // Cas : aucune donnée historique
        if (similarIncidents == null || similarIncidents.isEmpty()) {
            return buildDefault(severity);
        }

        // Calculer le temps moyen de résolution depuis les incidents similaires
        double avgResolutionTime = similarIncidents.stream()
                .mapToInt(SplunkMCPService.SimilarIncident::resolutionTimeMinutes)
                .filter(t -> t > 0)
                .average()
                .orElse(estimateByServerity(severity));

        // Ajustement selon la sévérité actuelle
        double adjustedTime = adjustBySeverity(avgResolutionTime, severity);

        // Calcul du score de confiance
        int confidence = calculateConfidence(similarIncidents, splunkContext);

        // Recommandation basée sur les données
        String recommendation = buildRecommendation(similarIncidents, severity);

        // Incidents utilisés pour le calcul
        int incidentsUsed = (int) similarIncidents.stream()
                .filter(i -> i.resolutionTimeMinutes() > 0)
                .count();

        log.info("Resolution prediction: {}min, confidence: {}%, based on {} incidents",
                (int) adjustedTime, confidence, incidentsUsed);

        return new ResolutionPrediction(
                (int) adjustedTime,
                confidence,
                incidentsUsed,
                recommendation
        );
    }

    private double adjustBySeverity(double baseTime, String severity) {
        return switch (severity) {
            case "Critical" -> baseTime * 1.5;
            case "High"     -> baseTime * 1.2;
            case "Medium"   -> baseTime * 1.0;
            case "Low"      -> baseTime * 0.8;
            default         -> baseTime;
        };
    }

    private int calculateConfidence(
            List<SplunkMCPService.SimilarIncident> incidents,
            SplunkMCPService.SplunkContext ctx) {

        int base = 40; // confiance de base

        // +10 par incident similaire (max +30)
        base += Math.min(incidents.size() * 10, 30);

        // +15 si historique Splunk trouvé
        if (ctx != null && ctx.found()) base += 15;

        // +10 si plusieurs occurrences connues
        if (ctx != null && ctx.occurrences() > 5) base += 10;

        // +5 si tous les incidents ont un temps de résolution
        boolean allHaveTime = incidents.stream()
                .allMatch(i -> i.resolutionTimeMinutes() > 0);
        if (allHaveTime) base += 5;

        return Math.min(base, 95); // max 95% — jamais 100%
    }

    private String buildRecommendation(
            List<SplunkMCPService.SimilarIncident> incidents,
            String severity) {

        // Prendre la solution du premier incident similaire le plus pertinent
        String bestFix = incidents.stream()
                .filter(i -> i.solution() != null && !i.solution().isBlank())
                .map(SplunkMCPService.SimilarIncident::solution)
                .findFirst()
                .orElse(null);

        if (bestFix != null) {
            // Extraire la première action de la solution
            String firstAction = bestFix.split("\\.")[0].trim();
            return firstAction.length() > 10 ? firstAction : bestFix;
        }

        // Recommandation par défaut selon sévérité
        return switch (severity) {
            case "Critical" -> "Immediately escalate to senior dev and check service logs";
            case "High"     -> "Check database connectivity and null pointer sources";
            case "Medium"   -> "Review recent code changes and add defensive null checks";
            default         -> "Add logging and monitor the issue for recurrence";
        };
    }

    private double estimateByServerity(String severity) {
        return switch (severity) {
            case "Critical" -> 60.0;
            case "High"     -> 30.0;
            case "Medium"   -> 20.0;
            default         -> 10.0;
        };
    }

    private ResolutionPrediction buildDefault(String severity) {
        return new ResolutionPrediction(
                (int) estimateByServerity(severity),
                25,
                0,
                "No historical data available — start by checking recent code changes"
        );
    }
}