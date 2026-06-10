package com.logwise.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ResolutionPrediction {
    private int estimatedMinutes;
    private int confidenceScore;
    private int incidentsUsed;
    private String recommendation;
}