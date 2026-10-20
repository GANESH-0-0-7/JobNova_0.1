
package com.example.jobnova_backend.dto;

import jakarta.validation.constraints.NotBlank;

public class SignInRequest {

    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    public SignInRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) {
        this.password = password;
    }
}
