package com.employeesystem.emsbackend.config;

import com.employeesystem.emsbackend.entity.Employee;
import com.employeesystem.emsbackend.entity.Department;
import com.employeesystem.emsbackend.entity.EmploymentType;
import com.employeesystem.emsbackend.entity.EmployeeStatus;
import com.employeesystem.emsbackend.entity.Gender;
import com.employeesystem.emsbackend.entity.Role;
import com.employeesystem.emsbackend.entity.User;
import com.employeesystem.emsbackend.repository.EmployeeRepository;
import com.employeesystem.emsbackend.repository.DepartmentRepository;
import com.employeesystem.emsbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Bootstraps a single ADMIN account on first startup if no users exist yet,
 * and separately ensures that admin account is linked to a real Employee
 * record — not gated behind "no users exist", so it also self-heals for
 * databases (like this project's) that already had an admin user seeded
 * before this linking existed. No manual SQL required on upgrade.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-username:admin}")
    private String adminUsername;

    // No hardcoded default password on purpose — must be set explicitly,
    // otherwise every clone of this project would ship the same admin
    // password, defeating the point of fixing the last hardcoded secret.
    @Value("${app.seed.admin-password:}")
    private String adminPassword;

    @Value("${app.seed.admin-first-name:Harish}")
    private String adminFirstName;

    @Value("${app.seed.admin-last-name:Kattamuri}")
    private String adminLastName;

    @Value("${app.seed.admin-email:admin@peoplehub.local}")
    private String adminEmail;

    @Value("${app.seed.demo-data:true}")
    private boolean seedDemoData;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() == 0) {
            seedInitialAdmin();
        }
        linkAdminToEmployeeIfMissing();
        if (seedDemoData) {
            seedDemoEmployees();
        }
    }

    private void seedInitialAdmin() {
        if (adminPassword == null || adminPassword.isBlank()) {
            log.warn("No users exist and ADMIN_SEED_PASSWORD is not set — skipping admin seed. "
                    + "Set the ADMIN_SEED_PASSWORD environment variable and restart to create the initial admin account.");
            return;
        }

        User admin = new User();
        admin.setUsername(adminUsername);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);

        log.info("Seeded initial ADMIN account with username '{}'. Log in and create additional accounts via the Add Employee page.", adminUsername);
    }

    // Runs on every startup, not just the first — so an admin account
    // created before this linking existed gets fixed automatically the
    // next time the app restarts, instead of needing a manual DB edit.
    private void linkAdminToEmployeeIfMissing() {
        userRepository.findByUsername(adminUsername).ifPresent(admin -> {
            if (admin.getEmployee() != null) {
                return; // already linked, nothing to do
            }

            Employee employee = employeeRepository.findByEmail(adminEmail);
            if (employee == null) {
                employee = new Employee();
                employee.setFirstName(adminFirstName);
                employee.setLastName(adminLastName);
                employee.setEmail(adminEmail);
                employee = employeeRepository.save(employee);
            }

            admin.setEmployee(employee);
            userRepository.save(admin);

            log.info("Linked admin account '{}' to employee record '{} {}'.",
                    adminUsername, adminFirstName, adminLastName);
        });
    }

    private void seedDemoEmployees() {
        String[][] departments = {
                {"Engineering", "Product engineering and platform delivery"},
                {"Human Resources", "People operations and talent"},
                {"Finance", "Finance and payroll operations"},
                {"Sales", "Customer growth and partnerships"}
        };
        for (String[] item : departments) {
            if (!departmentRepository.existsByNameIgnoreCase(item[0])) {
                departmentRepository.save(new Department(null, item[0], item[1]));
            }
        }

        Map<String, Department> departmentsByName = departmentRepository.findAll().stream()
                .collect(Collectors.toMap(department -> department.getName().toLowerCase(), department -> department, (first, second) -> first));

        // These @peoplehub.demo accounts are deliberately identifiable as demo data.
        // They are fully populated so a fresh install showcases every employee-profile field.
        DemoEmployee[] people = {
                new DemoEmployee("Aarav", "Sharma", "aarav.sharma@peoplehub.demo", "Engineering", "Senior Software Engineer", Gender.MALE, "1994-05-12", "+91 98765 10001", "B+", "Neha Sharma", "+91 98765 20001", "12, Indiranagar, Bengaluru, Karnataka", "2019-06-17", "1250000", "Vikram Reddy"),
                new DemoEmployee("Ananya", "Iyer", "ananya.iyer@peoplehub.demo", "Human Resources", "HR Manager", Gender.FEMALE, "1992-09-23", "+91 98765 10002", "O+", "Suresh Iyer", "+91 98765 20002", "45, Adyar, Chennai, Tamil Nadu", "2018-04-09", "1180000", null),
                new DemoEmployee("Rohan", "Verma", "rohan.verma@peoplehub.demo", "Sales", "Account Executive", Gender.MALE, "1990-01-17", "+91 98765 10003", "A+", "Pooja Verma", "+91 98765 20003", "18, Gomti Nagar, Lucknow, Uttar Pradesh", "2021-08-02", "840000", "Arjun Patel"),
                new DemoEmployee("Priya", "Nair", "priya.nair@peoplehub.demo", "Finance", "Finance Manager", Gender.FEMALE, "1995-07-08", "+91 98765 10004", "AB+", "Rajeev Nair", "+91 98765 20004", "27, Vyttila, Kochi, Kerala", "2020-01-13", "1100000", null),
                new DemoEmployee("Vikram", "Reddy", "vikram.reddy@peoplehub.demo", "Engineering", "Engineering Manager", Gender.MALE, "1989-11-26", "+91 98765 10005", "O-", "Lakshmi Reddy", "+91 98765 20005", "8, Jubilee Hills, Hyderabad, Telangana", "2017-11-06", "1650000", null),
                new DemoEmployee("Kavya", "Menon", "kavya.menon@peoplehub.demo", "Human Resources", "Talent Specialist", Gender.FEMALE, "1996-03-14", "+91 98765 10006", "B-", "Maya Menon", "+91 98765 20006", "62, Panampilly Nagar, Kochi, Kerala", "2022-03-21", "760000", "Ananya Iyer"),
                new DemoEmployee("Arjun", "Patel", "arjun.patel@peoplehub.demo", "Sales", "Sales Manager", Gender.MALE, "1991-06-30", "+91 98765 10007", "A-", "Rita Patel", "+91 98765 20007", "31, Satellite, Ahmedabad, Gujarat", "2018-09-10", "1300000", null),
                new DemoEmployee("Meera", "Kulkarni", "meera.kulkarni@peoplehub.demo", "Finance", "Payroll Executive", Gender.FEMALE, "1993-12-04", "+91 98765 10008", "O+", "Amit Kulkarni", "+91 98765 20008", "14, Kothrud, Pune, Maharashtra", "2021-05-24", "820000", "Priya Nair"),
                new DemoEmployee("Aditya", "Rao", "aditya.rao@peoplehub.demo", "Engineering", "UX Designer", Gender.MALE, "1997-08-19", "+91 98765 10009", "B+", "Sunita Rao", "+91 98765 20009", "9, HSR Layout, Bengaluru, Karnataka", "2022-07-11", "880000", "Vikram Reddy"),
                new DemoEmployee("Sneha", "Gupta", "sneha.gupta@peoplehub.demo", "Sales", "Customer Success Manager", Gender.FEMALE, "1994-02-11", "+91 98765 10010", "A+", "Manoj Gupta", "+91 98765 20010", "73, Vaishali Nagar, Jaipur, Rajasthan", "2020-10-05", "980000", "Arjun Patel")
        };

        Map<String, Employee> employeesByName = new HashMap<>();
        for (DemoEmployee person : people) {
            Employee employee = employeeRepository.findByEmail(person.email());
            if (employee == null) {
                employee = new Employee();
                employee.setEmail(person.email());
            }
            employee.setFirstName(person.firstName());
            employee.setLastName(person.lastName());
            employee.setDepartment(departmentsByName.get(person.department().toLowerCase()));
            employee.setDesignation(person.designation());
            employee.setGender(person.gender());
            employee.setDateOfBirth(LocalDate.parse(person.dateOfBirth()));
            employee.setPhone(person.phone());
            employee.setAddress(person.address());
            employee.setBloodGroup(person.bloodGroup());
            employee.setEmergencyContactName(person.emergencyContactName());
            employee.setEmergencyContactPhone(person.emergencyContactPhone());
            employee.setEmploymentType(EmploymentType.FULL_TIME);
            employee.setStatus(EmployeeStatus.ACTIVE);
            employee.setJoiningDate(LocalDate.parse(person.joiningDate()));
            employee.setSalary(new BigDecimal(person.salary()));
            employee = employeeRepository.save(employee);
            employeesByName.put(person.firstName() + " " + person.lastName(), employee);
        }

        for (DemoEmployee person : people) {
            if (person.managerName() != null) {
                Employee employee = employeesByName.get(person.firstName() + " " + person.lastName());
                employee.setManager(employeesByName.get(person.managerName()));
                employeeRepository.save(employee);
            }
        }
        log.info("Demo workforce data is enabled. Ten fully populated Indian sample employee profiles are available.");
    }

    private record DemoEmployee(String firstName, String lastName, String email, String department,
                                String designation, Gender gender, String dateOfBirth, String phone,
                                String bloodGroup, String emergencyContactName, String emergencyContactPhone,
                                String address, String joiningDate, String salary, String managerName) {
    }
}
