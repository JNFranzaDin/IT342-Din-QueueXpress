package cit.edu.din.queuexpress.repository;

import cit.edu.din.queuexpress.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    List<User> findByApprovalStatusOrderByIdDesc(String approvalStatus);
}
