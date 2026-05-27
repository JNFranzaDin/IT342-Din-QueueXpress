package cit.edu.din.queuexpress.config;

import cit.edu.din.queuexpress.entity.User;
import cit.edu.din.queuexpress.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminAccountSeeder implements ApplicationRunner {

    public static final String ADMIN_EMAIL = "queuexpressadmin@gmail.com";
    public static final String ADMIN_PASSWORD = "queuexpress123";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminAccountSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        String normalizedEmail = ADMIN_EMAIL.trim().toLowerCase();
        User adminUser = userRepository.findByEmail(normalizedEmail).orElseGet(User::new);

        adminUser.setName("QueueXpress Admin");
        adminUser.setEmail(normalizedEmail);
        adminUser.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
        adminUser.setRole(User.ROLE_ADMIN);
        adminUser.setApprovalStatus(User.STATUS_APPROVED);
        adminUser.setOffice(null);

        userRepository.save(adminUser);
    }
}