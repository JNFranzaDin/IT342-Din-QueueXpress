package cit.edu.din.queuexpress.dto;

import cit.edu.din.queuexpress.entity.User;

public record AuthResponse(
        String message,
        Long userId,
        String name,
        String email) {

    public static AuthResponse fromUser(String message, User user) {
        return new AuthResponse(message, user.getId(), user.getName(), user.getEmail());
    }
}
