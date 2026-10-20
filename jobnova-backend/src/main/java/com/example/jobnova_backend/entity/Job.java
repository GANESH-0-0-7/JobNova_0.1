
package com.example.jobnova_backend.entity;

import java.text.NumberFormat;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Entity
@Table(
    name = "jobs",
    indexes = {
        @Index(name = "idx_job_location", columnList = "city, state"),
        @Index(name = "idx_job_category_type",
               columnList = "category, employment_type"),
        @Index(name = "idx_job_created_at", columnList = "created_at"),
        @Index(name = "idx_job_posted_by", columnList = "posted_by"),
        @Index(name = "idx_job_active", columnList = "is_active")
    }
)
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Job title is required")
    @Size(max = 100, message = "Title cannot exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String title;

    @NotBlank(message = "Job description is required")
    @Size(max = 5000, message = "Description cannot exceed 5000 characters")
    @Column(nullable = false, length = 5000)
    private String description;

    @NotBlank(message = "Company name is required")
    @Column(nullable = false)
    private String company;

    @Valid
    @Embedded
    private JobLocation location = new JobLocation();

    @Valid
    @Embedded
    private Salary salary = new Salary();

    @Valid
    @Embedded
    private Experience experience = new Experience();

    @ElementCollection
    @CollectionTable(
        name = "job_skills",
        joinColumns = @JoinColumn(name = "job_id")
    )
    @Column(name = "skill", nullable = false)
    private List<String> skills = new ArrayList<>();

    @NotBlank
    @Pattern(
        regexp = "full-time|part-time|contract|internship|freelance",
        message = "Invalid employment type"
    )
    @Column(name = "employment_type", nullable = false)
    private String employmentType = "full-time";

    @NotBlank
    @Pattern(
        regexp = "on-site|remote|hybrid",
        message = "Invalid job type"
    )
    @Column(name = "job_type", nullable = false)
    private String jobType = "on-site";

    @NotBlank
    @Pattern(
        regexp = "software-development|data-science|design|marketing|sales|" +
                 "finance|hr|operations|healthcare|education|manufacturing|" +
                 "retail|consulting|legal|media|hospitality|real-estate|" +
                 "construction|automotive|other",
        message = "Invalid job category"
    )
    @Column(nullable = false)
    private String category;

    @ElementCollection
    @CollectionTable(
        name = "job_requirements",
        joinColumns = @JoinColumn(name = "job_id")
    )
    @Column(name = "requirement", nullable = false)
    private List<String> requirements = new ArrayList<>();

    @ElementCollection
    @CollectionTable(
        name = "job_benefits",
        joinColumns = @JoinColumn(name = "job_id")
    )
    @Column(name = "benefit", nullable = false)
    private List<String> benefits = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "posted_by", nullable = false)
    private User postedBy;

    @Column(name = "applications_count", nullable = false)
    private Integer applicationsCount = 0;

    @Column(name = "views_count", nullable = false)
    private Integer viewsCount = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Future(message = "Application deadline should be in the future")
    private LocalDateTime deadline;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Job() {
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;

        if (applicationsCount == null) applicationsCount = 0;
        if (viewsCount == null) viewsCount = 0;
        if (isActive == null) isActive = true;

        cleanCollections();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        cleanCollections();
    }

    private void cleanCollections() {
        if (skills != null) {
            LinkedHashSet<String> cleanedSkills = new LinkedHashSet<>();

            for (String skill : skills) {
                if (skill != null && !skill.isBlank()) {
                    cleanedSkills.add(skill.trim().toLowerCase(Locale.ROOT));
                }
            }

            skills = new ArrayList<>(cleanedSkills);
        }

        if (requirements != null) {
            requirements.removeIf(
                value -> value == null || value.isBlank()
            );
            requirements.replaceAll(String::trim);
        }

        if (benefits != null) {
            benefits.removeIf(
                value -> value == null || value.isBlank()
            );
            benefits.replaceAll(String::trim);
        }

        if (title != null) title = title.trim();
        if (company != null) company = company.trim();
    }

    public String getPostedAgo() {
        if (createdAt == null) return null;

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

    public String getSalaryRange() {
        if (salary == null) return "Not disclosed";

        Double min = salary.getMin();
        Double max = salary.getMax();
        String currency = salary.getCurrency() == null
            ? "INR"
            : salary.getCurrency();

        boolean hasMin = min != null && min > 0;
        boolean hasMax = max != null && max > 0;

        if (!hasMin && !hasMax) return "Not disclosed";

        NumberFormat formatter =
            NumberFormat.getNumberInstance(Locale.US);
        formatter.setMaximumFractionDigits(2);

        if (hasMin && hasMax) {
            return currency + " " + formatter.format(min)
                + " - " + formatter.format(max);
        }

        if (hasMin) {
            return currency + " " + formatter.format(min) + "+";
        }

        return "Up to " + currency + " " + formatter.format(max);
    }

    public void incrementViews() {
        if (viewsCount == null) viewsCount = 0;
        viewsCount++;
    }

    public void incrementApplications() {
        if (applicationsCount == null) applicationsCount = 0;
        applicationsCount++;
    }

    public void decrementApplications() {
        if (applicationsCount != null && applicationsCount > 0) {
            applicationsCount--;
        }
    }

    // Getters and setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) {
        this.description = description;
    }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public JobLocation getLocation() { return location; }
    public void setLocation(JobLocation location) {
        this.location = location;
    }

    public Salary getSalary() { return salary; }
    public void setSalary(Salary salary) { this.salary = salary; }

    public Experience getExperience() { return experience; }
    public void setExperience(Experience experience) {
        this.experience = experience;
    }

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) {
        this.skills = skills;
    }

    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) {
        this.employmentType = employmentType;
    }

    public String getJobType() { return jobType; }
    public void setJobType(String jobType) {
        this.jobType = jobType;
    }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public List<String> getRequirements() { return requirements; }
    public void setRequirements(List<String> requirements) {
        this.requirements = requirements;
    }

    public List<String> getBenefits() { return benefits; }
    public void setBenefits(List<String> benefits) {
        this.benefits = benefits;
    }

    public User getPostedBy() { return postedBy; }
    public void setPostedBy(User postedBy) {
        this.postedBy = postedBy;
    }

    public Integer getApplicationsCount() { return applicationsCount; }
    public void setApplicationsCount(Integer applicationsCount) {
        this.applicationsCount = applicationsCount;
    }

    public Integer getViewsCount() { return viewsCount; }
    public void setViewsCount(Integer viewsCount) {
        this.viewsCount = viewsCount;
    }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getDeadline() { return deadline; }
    public void setDeadline(LocalDateTime deadline) {
        this.deadline = deadline;
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Embedded location object

    @Embeddable
    public static class JobLocation {

        @NotBlank
        @Column(name = "city", nullable = false)
        private String city;

        @NotBlank
        @Column(name = "state", nullable = false)
        private String state;

        @NotBlank
        @Column(name = "country", nullable = false)
        private String country = "India";

        @Column(name = "remote", nullable = false)
        private Boolean remote = false;

        public JobLocation() {}

        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }

        public String getState() { return state; }
        public void setState(String state) { this.state = state; }

        public String getCountry() { return country; }
        public void setCountry(String country) {
            this.country = country;
        }

        public Boolean getRemote() { return remote; }
        public void setRemote(Boolean remote) {
            this.remote = remote;
        }
    }

    // Embedded salary object

    @Embeddable
    public static class Salary {

        @NotNull
        @DecimalMin(value = "0.0")
        @Column(name = "salary_min")
        private Double min = 0.0;

        @NotNull
        @DecimalMin(value = "0.0")
        @Column(name = "salary_max")
        private Double max = 0.0;

        @Pattern(regexp = "INR|USD|EUR")
        @Column(name = "salary_currency", nullable = false)
        private String currency = "INR";

        public Salary() {}

        public Double getMin() { return min; }
        public void setMin(Double min) { this.min = min; }

        public Double getMax() { return max; }
        public void setMax(Double max) { this.max = max; }

        public String getCurrency() { return currency; }
        public void setCurrency(String currency) {
            this.currency = currency;
        }
    }

    // Embedded experience object

    @Embeddable
    public static class Experience {

        @NotNull
        @DecimalMin(value = "0.0")
        @Column(name = "experience_min")
        private Double min = 0.0;

        @DecimalMin(value = "0.0")
        @Column(name = "experience_max")
        private Double max;

        public Experience() {}

        public Double getMin() { return min; }
        public void setMin(Double min) { this.min = min; }

        public Double getMax() { return max; }
        public void setMax(Double max) { this.max = max; }
    }
}
