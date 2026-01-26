package com.portfolio.asset_management.application.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class HealthService {

    private final EventQueueService eventQueueService;

    public HealthService(EventQueueService eventQueueService) {
        this.eventQueueService = eventQueueService;
    }

    public Map<String, Object> systemHealth() {
        Map<String, Object> status = new HashMap<>();

        status.put("status", "UP");
        status.put("pendingEvents", eventQueueService.pendingEvents());
        status.put("timestamp", System.currentTimeMillis());

        return status;
    }
}
