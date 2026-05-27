package cit.edu.din.queuexpress.dto;

import cit.edu.din.queuexpress.entity.User;

public record UserSummaryResponse(
        Long userId,
        String name,
        String email,
        String role,
        String office,
        String approvalStatus) {

    public static UserSummaryResponse fromUser(User user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getOffice(),
                user.getApprovalStatus());
    }
}
