package cit.edu.din.queuexpress.service;

import cit.edu.din.queuexpress.dto.AuthResponse;
import cit.edu.din.queuexpress.dto.LoginRequest;
import cit.edu.din.queuexpress.dto.RegisterRequest;
import cit.edu.din.queuexpress.dto.UserSummaryResponse;
import cit.edu.din.queuexpress.entity.User;
import cit.edu.din.queuexpress.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }

        String requestedRole = request.role() == null || request.role().isBlank()
            ? User.ROLE_USER
            : request.role().trim().equalsIgnoreCase(User.ROLE_STAFF) ? User.ROLE_STAFF : User.ROLE_USER;
        String requestedOffice = request.office() == null || request.office().isBlank()
            ? null
            : request.office().trim();

        if (User.ROLE_STAFF.equalsIgnoreCase(requestedRole) && requestedOffice == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Staff registration requires an office");
        }

        User user = User.forRegistration(
            request.name(),
            normalizedEmail,
            passwordEncoder.encode(request.password()),
            requestedRole,
            requestedOffice);

        User savedUser = userRepository.save(user);
        String message = User.ROLE_STAFF.equalsIgnoreCase(savedUser.getRole())
            ? "Registration submitted and waiting for admin approval"
            : "Registration successful";
        return AuthResponse.fromUser(message, savedUser);
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        if (user.isStaff() && !User.STATUS_APPROVED.equalsIgnoreCase(user.getApprovalStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account is waiting for admin approval");
        }

        return AuthResponse.fromUser("Login successful", user);
    }

    public UserSummaryResponse findAccountByEmail(String email) {
        String normalizedEmail = normalizeEmail(email);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return UserSummaryResponse.fromUser(user);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
