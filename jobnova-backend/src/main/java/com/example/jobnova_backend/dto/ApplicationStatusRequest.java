package com.example.jobnova_backend.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;

public class ApplicationStatusRequest {

    @NotBlank(message = "Status is required")
    private String status;

    private String notes;

    private Map<String, Object> interviewDetails;

    private Map<String, Object> feedback;

    public ApplicationStatusRequest() {
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Map<String, Object> getInterviewDetails() {
        return interviewDetails;
    }

    public void setInterviewDetails(Map<String, Object> interviewDetails) {
        this.interviewDetails = interviewDetails;
    }

    public Map<String, Object> getFeedback() {
        return feedback;
    }

    public void setFeedback(Map<String, Object> feedback) {
        this.feedback = feedback;
    }
}