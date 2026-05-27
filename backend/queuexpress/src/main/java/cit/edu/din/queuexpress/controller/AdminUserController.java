package cit.edu.din.queuexpress.controller;

import cit.edu.din.queuexpress.dto.UserSummaryResponse;
import cit.edu.din.queuexpress.entity.User;
import cit.edu.din.queuexpress.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserRepository userRepository;

    public AdminUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/pending")
    public ResponseEntity<List<UserSummaryResponse>> getPendingUsers() {
        List<UserSummaryResponse> pendingUsers = userRepository
                .findByApprovalStatusOrderByIdDesc(User.STATUS_PENDING)
                .stream()
                .map(UserSummaryResponse::fromUser)
                .toList();
        return ResponseEntity.ok(pendingUsers);
    }

    @PostMapping("/{userId}/approve")
    public ResponseEntity<UserSummaryResponse> approveUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setApprovalStatus(User.STATUS_APPROVED);
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(UserSummaryResponse.fromUser(savedUser));
    }

    @PostMapping("/{userId}/decline")
    public ResponseEntity<UserSummaryResponse> declineUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setApprovalStatus(User.STATUS_DECLINED);
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(UserSummaryResponse.fromUser(savedUser));
    }
}
