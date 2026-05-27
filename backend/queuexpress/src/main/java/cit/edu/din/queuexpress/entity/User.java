package cit.edu.din.queuexpress.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class User {

    public static final String ROLE_USER = "USER";
    public static final String ROLE_STAFF = "STAFF";
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_DECLINED = "DECLINED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false, length = 100)
    private String password;

    @Column(nullable = false, length = 20)
    private String role = ROLE_USER;

    @Column(nullable = false, length = 20)
    private String approvalStatus = STATUS_APPROVED;

    @Column(length = 50)
    private String office;

    public User() {
    }

    public User(String name, String email, String password) {
        this(name, email, password, ROLE_USER);
    }

    public User(String name, String email, String password, String role) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role == null || role.isBlank() ? ROLE_USER : role;
        this.approvalStatus = ROLE_STAFF.equalsIgnoreCase(this.role) ? STATUS_PENDING : STATUS_APPROVED;
    }

    public User(String name, String email, String password, String role, String office) {
        this(name, email, password, role);
        this.office = office;
    }

    public static User forRegistration(String name, String email, String password) {
        return new User(
                name == null ? null : name.trim(),
                email == null ? null : email.trim().toLowerCase(),
                password,
                ROLE_USER);
    }

    public static User forRegistration(String name, String email, String password, String role, String office) {
        String normalizedRole = role == null || role.isBlank() ? ROLE_USER : role.trim().toUpperCase();
        String normalizedOffice = office == null || office.isBlank() ? null : office.trim();
        User user = new User(
                name == null ? null : name.trim(),
                email == null ? null : email.trim().toLowerCase(),
                password,
                normalizedRole,
                normalizedOffice);
        user.setApprovalStatus(ROLE_STAFF.equalsIgnoreCase(normalizedRole) ? STATUS_PENDING : STATUS_APPROVED);
        return user;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role == null || role.isBlank() ? ROLE_USER : role;
    }

    public String getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(String approvalStatus) {
        this.approvalStatus = approvalStatus == null || approvalStatus.isBlank() ? STATUS_APPROVED : approvalStatus;
    }

    public String getOffice() {
        return office;
    }

    public void setOffice(String office) {
        this.office = office;
    }

    public boolean isAdmin() {
        return ROLE_ADMIN.equalsIgnoreCase(role);
    }

    public boolean isStaff() {
        return ROLE_STAFF.equalsIgnoreCase(role);
    }
}
