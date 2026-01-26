package com.portfolio.asset_management.domain.event;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "domain_events")
public class DomainEvent {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String eventType;

    @Column(nullable = false)
    private String aggregateType;

    @Column(nullable = false)
    private UUID aggregateId;

    @Column(nullable = false)
    private String actor;

    @Column(nullable = false)
    private LocalDateTime occurredAt;

    @Column(columnDefinition = "TEXT")
    private String payloadBefore;

    @Column(columnDefinition = "TEXT")
    private String payloadAfter;

    protected DomainEvent() {}

    public DomainEvent(
            String eventType,
            String aggregateType,
            UUID aggregateId,
            String actor,
            String payloadBefore,
            String payloadAfter
    ) {
        this.eventType = eventType;
        this.aggregateType = aggregateType;
        this.aggregateId = aggregateId;
        this.actor = actor;
        this.payloadBefore = payloadBefore;
        this.payloadAfter = payloadAfter;
        this.occurredAt = LocalDateTime.now();
    }
}
