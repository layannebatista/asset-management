package com.portfolio.asset_management.domain.report;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type; // SLA, INVENTORY, AUDIT, EXECUTIVE

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content; // JSON estruturado

    @Column(nullable = false)
    private Long requestedBy;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected Report() {
    }

    public Report(String type, String title, String content, Long requestedBy) {
        this.type = type;
        this.title = title;
        this.content = content;
        this.requestedBy = requestedBy;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public Long getRequestedBy() {
        return requestedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
