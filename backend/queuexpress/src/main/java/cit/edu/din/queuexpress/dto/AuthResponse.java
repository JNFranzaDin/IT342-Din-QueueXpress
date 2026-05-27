package cit.edu.din.queuexpress.dto;

import cit.edu.din.queuexpress.entity.User;

public record AuthResponse(
        String message,
        Long userId,
        String name,
        String email,
        String role,
        String approvalStatus,
        String office) {

    public static AuthResponse fromUser(String message, User user) {
        return new AuthResponse(
                message,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getApprovalStatus(),
                user.getOffice());
    }
}
