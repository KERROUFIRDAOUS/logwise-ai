package com.logwise.dto;

import com.logwise.service.SplunkMCPService;
import lombok.Data;
import java.util.List;

@Data
public class AnalyzeResponse {
    private String cause;
    private String explanation;
    private String severity;
    private String severityReason;
    private List<String> fixes;
    private String splunkContext;
    private List<SplunkMCPService.SimilarIncident> similarIncidents;
    private List<SplunkMCPService.TimelineEvent> timeline;
    private ResolutionPrediction resolutionPrediction;
}
