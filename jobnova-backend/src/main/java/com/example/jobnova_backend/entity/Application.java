package com.example.jobnova_backend.entity;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import jakarta.validation.constraints.Size;

@Entity
@Table(
    name = "applications",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_application_job_applicant",
            columnNames = {"job_id", "applicant_id"}
        )
    },
    indexes = {
        @Index(
            name = "idx_application_applicant_status",
            columnList = "applicant_id, status"
        ),
        @Index(
            name = "idx_application_job_status",
            columnList = "job_id, status"
        ),
        @Index(
            name = "idx_application_created_at",
            columnList = "created_at"
        )
    }
)
public class Application {

    public enum Status {
        SUBMITTED("submitted"),
        UNDER_REVIEW("under-review"),
        SHORTLISTED("shortlisted"),
        INTERVIEW_SCHEDULED("interview-scheduled"),
        INTERVIEWED("interviewed"),
        SELECTED("selected"),
        REJECTED("rejected"),
        WITHDRAWN("withdrawn");

        private final String value;

        Status(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static Status fromValue(String value) {
            if (value == null || value.isBlank()) {
                throw new IllegalArgumentException(
                    "Application status is required"
                );
            }

            for (Status status : values()) {
                if (status.value.equalsIgnoreCase(value.trim())) {
                    return status;
                }
            }

            throw new IllegalArgumentException(
                "Invalid application status: " + value
            );
        }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "applicant_id", nullable = false)
    private User applicant;

    @Size(max = 2000, message = "Cover letter cannot exceed 2000 characters")
    @Column(name = "cover_letter", length = 2000)
    private String coverLetter;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "profile_data", columnDefinition = "jsonb")
    private Map<String, Object> profileData = new LinkedHashMap<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Status status = Status.SUBMITTED;

    @ElementCollection
    @CollectionTable(
        name = "application_timeline",
        joinColumns = @JoinColumn(name = "application_id")
    )
    @OrderColumn(name = "timeline_order")
    private List<TimelineEntry> timeline = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "interview_details", columnDefinition = "jsonb")
    private Map<String, Object> interviewDetails = new LinkedHashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "feedback", columnDefinition = "jsonb")
    private Map<String, Object> feedback = new LinkedHashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "salary_expectation", columnDefinition = "jsonb")
    private Map<String, Object> salaryExpectation = new LinkedHashMap<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Version
    private Long version;

    public Application() {
    }

    @jakarta.persistence.PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;

        if (status == null) {
            status = Status.SUBMITTED;
        }

        if (profileData == null) {
            profileData = new LinkedHashMap<>();
        }

        if (interviewDetails == null) {
            interviewDetails = new LinkedHashMap<>();
        }

        if (feedback == null) {
            feedback = new LinkedHashMap<>();
        }

        if (salaryExpectation == null) {
            salaryExpectation = new LinkedHashMap<>();
        }

        if (timeline == null) {
            timeline = new ArrayList<>();
        }

        if (timeline.isEmpty()) {
            addTimelineEntry(status, null);
        }
    }

    @jakarta.persistence.PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Updates status and records one timeline entry.
     * Call this instead of directly changing status in the service.
     */
    public void updateStatus(String newStatus, String notes) {
        Status nextStatus = Status.fromValue(newStatus);

        this.status = nextStatus;
        addTimelineEntry(nextStatus, notes);
    }

    public void addTimelineEntry(Status status, String notes) {
        if (timeline == null) {
            timeline = new ArrayList<>();
        }

        timeline.add(new TimelineEntry(
            status,
            LocalDateTime.now(),
            notes
        ));
    }

    public void scheduleInterview(Map<String, Object> details) {
        this.interviewDetails = details == null
            ? new LinkedHashMap<>()
            : new LinkedHashMap<>(details);

        updateStatus(
            Status.INTERVIEW_SCHEDULED.getValue(),
            "Interview scheduled"
        );
    }

    public void addFeedback(Map<String, Object> feedback) {
        this.feedback = feedback == null
            ? new LinkedHashMap<>()
            : new LinkedHashMap<>(feedback);
    }

    public String getAppliedAgo() {
        if (createdAt == null) {
            return null;
        }

        long days = Math.max(
            0,
            Duration.between(createdAt, LocalDateTime.now()).toDays()
        );

        if (days == 0) return "Today";
        if (days == 1) return "Yesterday";
        if (days < 7) return days + " days ago";
        if (days < 30) return (days / 7) + " weeks ago";

        return (days / 30) + " months ago";
    }

    public Long getId() {
        return id;
    }

    public Job getJob() {
        return job;
    }

    public void setJob(Job job) {
        this.job = job;
    }

    public User getApplicant() {
        return applicant;
    }

    public void setApplicant(User applicant) {
        this.applicant = applicant;
    }

    public String getCoverLetter() {
        return coverLetter;
    }

    public void setCoverLetter(String coverLetter) {
        this.coverLetter = coverLetter;
    }

    public Map<String, Object> getProfileData() {
        return profileData;
    }

    public void setProfileData(Map<String, Object> profileData) {
        this.profileData = profileData == null
            ? new LinkedHashMap<>()
            : new LinkedHashMap<>(profileData);
    }

    public Status getStatus() {
        return status;
    }

    public String getStatusValue() {
        return status == null ? null : status.getValue();
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public List<TimelineEntry> getTimeline() {
        return timeline;
    }

    public Map<String, Object> getInterviewDetails() {
        return interviewDetails;
    }

    public void setInterviewDetails(Map<String, Object> details) {
        this.interviewDetails = details == null
            ? new LinkedHashMap<>()
            : new LinkedHashMap<>(details);
    }

    public Map<String, Object> getFeedback() {
        return feedback;
    }

    public void setFeedback(Map<String, Object> feedback) {
        this.feedback = feedback == null
            ? new LinkedHashMap<>()
            : new LinkedHashMap<>(feedback);
    }

    public Map<String, Object> getSalaryExpectation() {
        return salaryExpectation;
    }

    public void setSalaryExpectation(Map<String, Object> salaryExpectation) {
        this.salaryExpectation = salaryExpectation == null
            ? new LinkedHashMap<>()
            : new LinkedHashMap<>(salaryExpectation);
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    @Embeddable
    public static class TimelineEntry {

        @Enumerated(EnumType.STRING)
        @Column(name = "timeline_status", nullable = false, length = 32)
        private Status status;

        @Column(name = "timeline_date", nullable = false)
        private LocalDateTime date;

        @Column(name = "timeline_notes", length = 2000)
        private String notes;

        public TimelineEntry() {
        }

        public TimelineEntry(Status status, LocalDateTime date, String notes) {
            this.status = status;
            this.date = date;
            this.notes = notes;
        }

        public Status getStatus() {
            return status;
        }

        public String getStatusValue() {
            return status == null ? null : status.getValue();
        }

        public LocalDateTime getDate() {
            return date;
        }

        public String getNotes() {
            return notes;
        }
    }
}