package com.portfolio.asset_management.domain.notification;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification_requests")
public class NotificationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String channel; // EMAIL, WHATSAPP, SYSTEM
    private String recipient;
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String message;

    private String status; // PENDING, SENT, FAILED

    private int retryCount;

    private LocalDateTime createdAt;
    private LocalDateTime sentAt;

    protected NotificationRequest() {
    }

    public NotificationRequest(
            String channel,
            String recipient,
            String subject,
            String message
    ) {
        this.channel = channel;
        this.recipient = recipient;
        this.subject = subject;
        this.message = message;
        this.status = "PENDING";
        this.retryCount = 0;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getChannel() {
        return channel;
    }

    public String getRecipient() {
        return recipient;
    }

    public String getSubject() {
        return subject;
    }

    public String getMessage() {
        return message;
    }

    public String getStatus() {
        return status;
    }

    public int getRetryCount() {
        return retryCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void markAsSent() {
        this.status = "SENT";
        this.sentAt = LocalDateTime.now();
    }

    public void markAsFailed() {
        this.status = "FAILED";
        this.retryCount++;
    }
}
