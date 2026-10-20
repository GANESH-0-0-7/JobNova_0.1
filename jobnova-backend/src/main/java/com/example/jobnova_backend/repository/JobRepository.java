package com.example.jobnova_backend.repository;

import com.example.jobnova_backend.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobRepository extends JpaRepository<Job, Long> {
}