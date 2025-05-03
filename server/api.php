<?php
// Turn off error display to prevent HTML errors in JSON response
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set up custom error handler to capture errors
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    if (!(error_reporting() & $errno)) {
        // This error code is not included in error_reporting, so ignore it
        return false;
    }
    
    // Log the error
    error_log("PHP Error [$errno]: $errstr in $errfile on line $errline");
    
    // Don't execute PHP's internal error handler
    return true;
});

// Register shutdown function to capture fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && ($error['type'] === E_ERROR || $error['type'] === E_PARSE || $error['type'] === E_COMPILE_ERROR)) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'error' => 'Fatal PHP Error: ' . $error['message'],
            'file' => $error['file'],
            'line' => $error['line']
        ]);
        exit;
    }
});

// Include database configuration
require_once 'db_config.php';

// Ensure the default manager exists
if (!ensureDefaultManagerExists()) {
    error_log("CRITICAL: Failed to ensure default manager exists. Some operations might fail.");
}

// Set headers for JSON response
header('Content-Type: application/json');

// Get the request method and endpoint
$request_method = $_SERVER['REQUEST_METHOD'];
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';

// Debug logging
error_log("Received endpoint: " . $endpoint);

// Handle different endpoints based on the request
switch (true) {
    case $endpoint === 'complexes':
        getComplexes();
        break;
    
    case $endpoint === 'apartments':
        getApartments();
        break;
    
    case $endpoint === 'renters':
        getRenters();
        break;
    
    case $endpoint === 'employees':
        getEmployees();
        break;
    
    case preg_match('/^employee\/(\d{9})$/', $endpoint, $matches):
        getEmployee($matches[1]);
        break;
    
    case $endpoint === 'maintenance_requests':
        getMaintenanceRequests();
        break;
    
    case $endpoint === 'projects':
        getProjects();
        break;
    
    case $endpoint === 'leases':
        getLeases();
        break;
    
    case $endpoint === 'dashboard_stats':
        getDashboardStats();
        break;
    
    case $endpoint === 'update_employee':
        updateEmployee();
        break;
    
    case $endpoint === 'add_employee':
        addEmployee();
        break;
    
    case $endpoint === 'delete_employee':
        deleteEmployee();
        break;
    
    case $endpoint === 'update_complex_manager':
        updateComplexManager();
        break;
    
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found: ' . $endpoint]);
        break;
}

// Function to get all complex data
function getComplexes() {
    global $pdo;
    
    // Set no-cache headers to ensure fresh data
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    try {
        error_log("Starting getComplexes function");
        
        $stmt = $pdo->prepare("
            SELECT 
                ac.Complex_Number AS \"Complex_Number\",
                ac.Street AS \"Street\", 
                ac.City AS \"City\", 
                ac.Addr_State AS \"Addr_State\",
                ac.Manager AS \"Manager\",
                e.Name AS \"Manager_Name\"
            FROM Apartment_Complex ac
            LEFT JOIN Employee e ON ac.Manager = e.ESSN
        ");
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        error_log("Retrieved " . count($results) . " complexes from database");
        
        echo json_encode(['success' => true, 'data' => $results]);
    } catch (PDOException $e) {
        error_log("Error in getComplexes: " . $e->getMessage() . "\nStack trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    } catch (Exception $e) {
        error_log("General error in getComplexes: " . $e->getMessage() . "\nStack trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
    } catch (Error $e) {
        // Catch PHP 7+ errors
        error_log("PHP Error in getComplexes: " . $e->getMessage() . "\nStack trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'PHP Error: ' . $e->getMessage()]);
    }
}

// Function to get apartments with their complex info
function getApartments() {
    global $pdo;
    try {
        $stmt = $pdo->prepare("
            SELECT 
                a.Complex_Number AS \"Complex_Number\", 
                a.Room_Number AS \"Room_Number\", 
                a.Floor_Plan AS \"Floor_Plan\",
                ac.Street AS \"Street\", 
                ac.City AS \"City\", 
                ac.Addr_State AS \"Addr_State\",
                CASE
                    WHEN r.RSSN IS NOT NULL THEN 'Occupied'
                    ELSE 'Vacant'
                END AS \"Status\",
                r.Name AS \"Renter_Name\"
            FROM Apartment a
            JOIN Apartment_Complex ac ON a.Complex_Number = ac.Complex_Number
            LEFT JOIN Renters r ON a.Complex_Number = r.Complex_Number AND a.Room_Number = r.Room_Number
        ");
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $results]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Function to get renters with their apartment info
function getRenters() {
    global $pdo;
    try {
        $stmt = $pdo->prepare("
            SELECT 
                r.RSSN AS \"RSSN\",
                r.Credit_Score AS \"Credit_Score\",
                r.Name AS \"Name\",
                r.Complex_Number AS \"Complex_Number\",
                r.Room_Number AS \"Room_Number\",
                a.Floor_Plan AS \"Floor_Plan\",
                ac.Street AS \"Street\",
                ac.City AS \"City\",
                ac.Addr_State AS \"Addr_State\"
            FROM Renters r
            JOIN Apartment a ON r.Room_Number = a.Room_Number AND r.Complex_Number = a.Complex_Number
            JOIN Apartment_Complex ac ON r.Complex_Number = ac.Complex_Number
        ");
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $results]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Function to get employees
function getEmployees() {
    global $pdo;
    
    // Set no-cache headers to ensure fresh data
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    try {
        error_log("Starting getEmployees function");
        
        // Get basic employee info
        $stmt = $pdo->prepare("
            SELECT 
                e.ESSN AS \"ESSN\",
                e.Name AS \"Name\",
                e.Salary AS \"Salary\"
            FROM Employee e
        ");
        $stmt->execute();
        $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("Retrieved " . count($employees) . " employees from database");
        
        // For each employee, get their assigned complexes
        foreach ($employees as &$employee) {
            // Get complexes the employee works at
            $worksAtComplexesStmt = $pdo->prepare("
                SELECT 
                    ac.Complex_Number AS \"Complex_Number\",
                    ac.Street AS \"Street\",
                    ac.City AS \"City\",
                    ac.Addr_State AS \"Addr_State\"
                FROM Employee_At_Complex eac
                JOIN Apartment_Complex ac ON eac.Complex_Number = ac.Complex_Number
                WHERE eac.ESSN = ?
            ");
            $worksAtComplexesStmt->execute([$employee['ESSN']]);
            $worksAtComplexes = $worksAtComplexesStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format assigned complexes as a comma-separated string of complex numbers
            $assignedComplexNumbers = array_map(function($complex) {
                return $complex['Complex_Number'];
            }, $worksAtComplexes);
            
            $employee['Assigned_Complexes'] = !empty($assignedComplexNumbers) ? implode(', ', $assignedComplexNumbers) : '';
            
            // Also include the complex objects for more detailed display
            $employee['WorksAtComplexes'] = $worksAtComplexes;
        }
        
        error_log("Processed employee data successfully, returning response");
        echo json_encode(['success' => true, 'data' => $employees]);
    } catch (PDOException $e) {
        error_log("Error in getEmployees: " . $e->getMessage() . "\nStack trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    } catch (Exception $e) {
        error_log("General error in getEmployees: " . $e->getMessage() . "\nStack trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'An unexpected error occurred: ' . $e->getMessage()]);
    }
}

// Function to get a single employee by ESSN
function getEmployee($essn) {
    global $pdo;
    try {
        // Format ESSN properly - ensure it's exactly 11 characters (XXX-XX-XXXX format)
        // First remove any existing dashes
        $essn = preg_replace('/[^0-9]/', '', $essn);
        // Ensure it's 9 digits long
        if (strlen($essn) != 9) {
            error_log("Invalid ESSN format, must be 9 digits: " . $essn);
            http_response_code(400);
            echo json_encode(['error' => 'Invalid ESSN format, must be 9 digits']);
            return;
        }
        // Format with dashes to match XXX-XX-XXXX (11 characters total)
        $essn = preg_replace('/^(\d{3})(\d{2})(\d{4})$/', '$1-$2-$3', $essn);
        
        error_log("Looking up employee with formatted ESSN: " . $essn);
        
        // Check if employee exists
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM Employee WHERE ESSN = ?");
        $checkStmt->execute([$essn]);
        if ($checkStmt->fetchColumn() == 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Employee not found']);
            return;
        }

        // Get basic employee info
        $stmt = $pdo->prepare("
            SELECT 
                e.ESSN AS \"ESSN\",
                e.Name AS \"Name\",
                e.Salary AS \"Salary\"
            FROM Employee e
            WHERE e.ESSN = ?
        ");
        $stmt->execute([$essn]);
        $employee = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Initialize arrays to avoid undefined issues
        $managedComplexes = [];
        $worksAtComplexes = [];
        $projects = [];
        
        // Get complexes the employee manages
        $managedComplexesStmt = $pdo->prepare("
            SELECT 
                ac.Complex_Number AS \"Complex_Number\",
                ac.Street AS \"Street\",
                ac.City AS \"City\",
                ac.Addr_State AS \"Addr_State\"
            FROM Apartment_Complex ac
            WHERE ac.Manager = ?
        ");
        $managedComplexesStmt->execute([$essn]);
        $result = $managedComplexesStmt->fetchAll(PDO::FETCH_ASSOC);
        if ($result) {
            $managedComplexes = $result;
        }
        
        // Get complexes the employee works at
        $worksAtComplexesStmt = $pdo->prepare("
            SELECT 
                ac.Complex_Number AS \"Complex_Number\",
                ac.Street AS \"Street\",
                ac.City AS \"City\",
                ac.Addr_State AS \"Addr_State\"
            FROM Employee_At_Complex eac
            JOIN Apartment_Complex ac ON eac.Complex_Number = ac.Complex_Number
            WHERE eac.ESSN = ?
        ");
        $worksAtComplexesStmt->execute([$essn]);
        $result = $worksAtComplexesStmt->fetchAll(PDO::FETCH_ASSOC);
        if ($result) {
            $worksAtComplexes = $result;
        }
        
        // Get projects the employee is working on
        $projectsStmt = $pdo->prepare("
            SELECT 
                efi.Project_ID AS \"Project_ID\",
                wo.Type AS \"Type\",
                wo.Complex_Number AS \"Complex_Number\",
                pi.Description AS \"Description\"
            FROM Employee_Fix_Issue efi
            JOIN Work_Order wo ON efi.Project_ID = wo.Project_ID AND efi.Complex_Number = wo.Complex_Number
            LEFT JOIN Property_Issues pi ON efi.Project_ID = pi.Project_ID AND efi.Complex_Number = pi.Complex_Number
            WHERE efi.ESSN = ?
        ");
        $projectsStmt->execute([$essn]);
        $result = $projectsStmt->fetchAll(PDO::FETCH_ASSOC);
        if ($result) {
            $projects = $result;
        }
        
        // Log the counts for debugging
        error_log("Employee {$essn} info: ManagedComplexes: " . count($managedComplexes) . 
                  ", WorksAt: " . count($worksAtComplexes) . 
                  ", Projects: " . count($projects));
        
        // Add related data to employee record
        $employee['ManagedComplexes'] = $managedComplexes;
        $employee['WorksAtComplexes'] = $worksAtComplexes;
        $employee['Projects'] = $projects;
        
        echo json_encode(['success' => true, 'data' => $employee]);
    } catch (PDOException $e) {
        error_log("Error in getEmployee: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Function to get maintenance requests (property issues)
function getMaintenanceRequests() {
    global $pdo;
    try {
        $stmt = $pdo->prepare("
            SELECT 
                pi.Project_ID AS \"Project_ID\",
                pi.Description AS \"Description\",
                pi.Complex_Number AS \"Complex_Number\",
                wo.Type AS \"Issue_Type\", 
                r.Name AS \"Reported_By\",
                ac.Street AS \"Street\", 
                ac.City AS \"City\", 
                ac.Addr_State AS \"Addr_State\"
            FROM Property_Issues pi
            JOIN Work_Order wo ON pi.Project_ID = wo.Project_ID AND pi.Complex_Number = wo.Complex_Number
            JOIN Apartment_Complex ac ON pi.Complex_Number = ac.Complex_Number
            LEFT JOIN Renter_Report_Issue rri ON pi.Project_ID = rri.Project_ID AND pi.Complex_Number = rri.Complex_Number
            LEFT JOIN Renters r ON rri.RSSN = r.RSSN
        ");
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $results]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Function to get projects (work orders)
function getProjects() {
    global $pdo;
    try {
        $stmt = $pdo->prepare("
            SELECT 
                wo.Project_ID AS \"Project_ID\",
                wo.Type AS \"Type\",
                wo.Complex_Number AS \"Complex_Number\",
                dp.Budget AS \"Budget\",
                ac.Street AS \"Street\",
                ac.City AS \"City\",
                ac.Addr_State AS \"Addr_State\"
            FROM Work_Order wo
            JOIN Apartment_Complex ac ON wo.Complex_Number = ac.Complex_Number
            LEFT JOIN Development_Projects dp ON wo.Project_ID = dp.Project_ID AND wo.Complex_Number = dp.Complex_Number
        ");
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $results]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Function to get leases
function getLeases() {
    global $pdo;
    try {
        $stmt = $pdo->prepare("
            SELECT 
                l.Contract_ID AS \"Contract_ID\",
                l.Type AS \"Type\",
                lt.Payment_Amount AS \"Payment_Amount\",
                r.Name AS \"Renter_Name\",
                r.RSSN AS \"RSSN\",
                r.Complex_Number AS \"Complex_Number\",
                r.Room_Number AS \"Room_Number\"
            FROM Lease l
            JOIN Lease_Type lt ON l.Type = lt.Type
            JOIN Renter_Sign_Lease rsl ON l.Contract_ID = rsl.Contract_ID
            JOIN Renters r ON rsl.RSSN = r.RSSN
        ");
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $results]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Function to get dashboard overview stats
function getDashboardStats() {
    global $pdo;
    try {
        // Get total apartments
        $stmt = $pdo->query("SELECT COUNT(*) as total_units FROM Apartment");
        $total_units = $stmt->fetch()['total_units'];
        
        // Get occupied apartments (those with renters)
        $stmt = $pdo->query("
            SELECT COUNT(DISTINCT (Complex_Number, Room_Number)) as occupied_units 
            FROM Renters
        ");
        $occupied_units = $stmt->fetch()['occupied_units'];
        
        // Calculate vacant units
        $vacant_units = $total_units - $occupied_units;
        
        // Get pending maintenance requests
        $stmt = $pdo->query("SELECT COUNT(*) as pending_requests FROM Property_Issues");
        $pending_requests = $stmt->fetch()['pending_requests'];
        
        // Get active projects
        $stmt = $pdo->query("SELECT COUNT(*) as active_projects FROM Development_Projects");
        $active_projects = $stmt->fetch()['active_projects'];
        
        // Return all stats
        echo json_encode([
            'success' => true,
            'data' => [
                'Total_Units' => $total_units,
                'Occupied_Units' => $occupied_units,
                'Vacant_Units' => $vacant_units,
                'Pending_Requests' => $pending_requests,
                'Active_Projects' => $active_projects
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Function to ensure default manager exists
function ensureDefaultManagerExists() {
    global $pdo;
    
    try {
        // Check if default manager exists with various formats
        $checkStmt = $pdo->prepare("SELECT ESSN FROM Employee WHERE ESSN = '000-000-0000' OR ESSN = '000000000'");
        $checkStmt->execute();
        $defaultEssn = $checkStmt->fetchColumn();
        
        if ($defaultEssn) {
            error_log("Default manager exists with ESSN: " . $defaultEssn);
            return true;
        }
        
        error_log("Default manager does not exist, trying to create one");
        
        // Try to create the default manager
        try {
            $pdo->beginTransaction();
            
            // Try first format
            $insertStmt = $pdo->prepare("
                INSERT INTO Employee (ESSN, Name, Salary)
                VALUES ('000-000-0000', 'Default Manager', 0)
            ");
            $insertStmt->execute();
            
            $pdo->commit();
            error_log("Created default manager with ESSN '000-000-0000'");
            return true;
        } 
        catch (PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            
            error_log("Failed to create default manager with format '000-000-0000': " . $e->getMessage());
            
            // Try with alternative format
            try {
                $pdo->beginTransaction();
                
                $insertStmt = $pdo->prepare("
                    INSERT INTO Employee (ESSN, Name, Salary)
                    VALUES ('000000000', 'Default Manager', 0)
                ");
                $insertStmt->execute();
                
                $pdo->commit();
                error_log("Created default manager with ESSN '000000000'");
                return true;
            } 
            catch (PDOException $e2) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                error_log("Failed to create default manager with format '000000000': " . $e2->getMessage());
            }
        }
        
        // If we get here, all attempts failed
        error_log("All attempts to create default manager failed");
        return false;
    } 
    catch (Exception $e) {
        error_log("General error ensuring default manager exists: " . $e->getMessage());
        return false;
    }
}

// Function to update employee data
function updateEmployee() {
    global $pdo;
    
    // Get POST data
    $raw_input = file_get_contents('php://input');
    error_log("Raw input: " . $raw_input);
    
    $data = json_decode($raw_input, true);
    
    if (!$data) {
        $json_error = json_last_error_msg();
        error_log("JSON decode error: " . $json_error);
        http_response_code(400);
        echo json_encode(['error' => 'Invalid request data: ' . $json_error]);
        return;
    }
    
    // Validate required fields
    if (empty($data['essn']) || empty($data['name']) || !isset($data['salary'])) {
        error_log("Missing required fields: " . json_encode($data));
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: ESSN, Name, and Salary are required']);
        return;
    }
    
    error_log("Processing update for employee with ESSN: " . $data['essn']);
    error_log("Update data: " . json_encode($data));
    
    try {
        // Start transaction
        $pdo->beginTransaction();
        
        // Format ESSN properly - ensure it's exactly 11 characters (XXX-XX-XXXX format)
        $essn = $data['essn'];
        // First remove any existing dashes
        $essn = preg_replace('/[^0-9]/', '', $essn);
        // Ensure it's 9 digits long
        if (strlen($essn) != 9) {
            $pdo->rollBack();
            error_log("Invalid ESSN format, must be 9 digits: " . $essn);
            http_response_code(400);
            echo json_encode(['error' => 'Invalid ESSN format, must be 9 digits']);
            return;
        }
        // Format with dashes to match XXX-XX-XXXX (11 characters total)
        $essn = preg_replace('/^(\d{3})(\d{2})(\d{4})$/', '$1-$2-$3', $essn);
        
        error_log("Formatted ESSN (should be XXX-XX-XXXX format): " . $essn);
        
        // Check if employee exists and update in one step
        $updateStmt = $pdo->prepare("
            UPDATE Employee 
            SET Name = :name,
                Salary = :salary
            WHERE ESSN = :essn
            RETURNING *
        ");
        
        $updateStmt->execute([
            ':name' => $data['name'],
            ':salary' => $data['salary'],
            ':essn' => $essn
        ]);
        
        $result = $updateStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            $pdo->rollBack();
            error_log("Employee not found with ESSN: " . $essn);
            http_response_code(404);
            echo json_encode(['error' => 'Employee not found']);
            return;
        }
        
        error_log("Basic info updated for employee: " . $essn);
        
        // Update managed complexes (update Apartment_Complex table)
        try {
            // First, get the complexes from the request
            $newManagedComplexes = [];
            if (isset($data['managedComplexes'])) {
                $newManagedComplexes = $data['managedComplexes'];
            }
            
            error_log("New managed complexes for ESSN $essn: " . json_encode($newManagedComplexes));
            
            // Get the current managed complexes
            $currentManagedComplexesStmt = $pdo->prepare("
                SELECT Complex_Number 
                FROM Apartment_Complex 
                WHERE Manager = :essn
            ");
            $currentManagedComplexesStmt->execute([':essn' => $essn]);
            $currentManagedComplexes = $currentManagedComplexesStmt->fetchAll(PDO::FETCH_COLUMN);
            
            error_log("Current managed complexes: " . json_encode($currentManagedComplexes));
            
            // Complexes to add management (in new but not in current)
            $managementToAdd = array_diff($newManagedComplexes, $currentManagedComplexes);
            
            // Complexes to remove management (in current but not in new)
            $managementToRemove = array_diff($currentManagedComplexes, $newManagedComplexes);
            
            error_log("Complexes to add management: " . json_encode($managementToAdd));
            error_log("Complexes to remove management: " . json_encode($managementToRemove));
            
            // Check if we need to handle removing management
            if (!empty($managementToRemove)) {
                // We know the Manager column has a NOT NULL constraint
                // Find another manager to substitute
                $availableManagersStmt = $pdo->prepare("
                    SELECT ESSN, Name 
                    FROM Employee 
                    WHERE ESSN != :essn 
                    ORDER BY Salary DESC
                    LIMIT 1
                ");
                $availableManagersStmt->execute([':essn' => $essn]);
                $substituteManager = $availableManagersStmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$substituteManager) {
                    error_log("WARNING: No substitute manager available, trying to use default manager");
                    
                    // Ensure the default manager exists
                    if (ensureDefaultManagerExists()) {
                        $substituteManager = [
                            'ESSN' => '000-000-0000',
                            'Name' => 'Default Manager'
                        ];
                    } else {
                        error_log("WARNING: Cannot create default manager, cannot remove management");
                        
                        // Can't remove any management - return error but still complete other updates
                        if (count($managementToRemove) > 0) {
                            // Rollback and return error - we can't proceed with the update as requested
                            $pdo->rollBack();
                            http_response_code(400);
                            echo json_encode([
                                'success' => false,
                                'error' => 'Cannot remove management from complexes because they require a manager and no substitute manager is available. Please add at least one more employee first.',
                                'keptManagedComplexes' => array_values($managementToRemove)
                            ]);
                            return;
                        }
                    }
                } 
                
                error_log("Found substitute manager: " . $substituteManager['ESSN'] . " - " . $substituteManager['Name']);
                
                // Assign substitute manager to all removed complexes
                foreach ($managementToRemove as $complexNumber) {
                    try {
                        $assignSubstituteStmt = $pdo->prepare("
                            UPDATE Apartment_Complex 
                            SET Manager = :substitute_essn 
                            WHERE Complex_Number = :complex_number AND Manager = :essn
                        ");
                        
                        $assignSubstituteStmt->execute([
                            ':substitute_essn' => $substituteManager['ESSN'],
                            ':complex_number' => $complexNumber,
                            ':essn' => $essn
                        ]);
                        
                        if ($assignSubstituteStmt->rowCount() > 0) {
                            error_log("Assigned substitute manager {$substituteManager['ESSN']} to complex $complexNumber");
                        } else {
                            error_log("Failed to assign substitute manager to complex $complexNumber");
                            $newManagedComplexes[] = $complexNumber;
                        }
                    } catch (PDOException $e) {
                        error_log("Error updating complex $complexNumber: " . $e->getMessage());
                        // Add to newManagedComplexes so we report it as kept
                        $newManagedComplexes[] = $complexNumber;
                    }
                }
            }
            
            // Add new complex management assignments
            if (!empty($managementToAdd)) {
                foreach ($managementToAdd as $complexNumber) {
                    $addManagerStmt = $pdo->prepare("
                        UPDATE Apartment_Complex 
                        SET Manager = :essn 
                        WHERE Complex_Number = :complex_number
                    ");
                    
                    $addManagerStmt->execute([
                        ':essn' => $essn,
                        ':complex_number' => $complexNumber
                    ]);
                    
                    error_log("Added employee as manager to complex: $complexNumber");
                }
            }
            
            error_log("Employee complex management updated successfully");
        } catch (PDOException $e) {
            error_log("Error updating managed complexes: " . $e->getMessage());
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
            return;
        }
        
        // Update works at complexes (update Employee_At_Complex table)
        try {
            // First, get the complexes from the request
            $newComplexes = [];
            if (isset($data['worksAtComplexes'])) {
                // Ensure worksAtComplexes is an array
                if (is_array($data['worksAtComplexes'])) {
                    $newComplexes = $data['worksAtComplexes'];
                } else {
                    $newComplexes = [$data['worksAtComplexes']];
                }
            }
            
            // Get the current complex assignments
            $currentComplexesStmt = $pdo->prepare("SELECT Complex_Number FROM Employee_At_Complex WHERE ESSN = :essn");
            $currentComplexesStmt->execute([':essn' => $essn]);
            $currentComplexes = $currentComplexesStmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Complexes to add (in new but not in current)
            $complexesToAdd = array_diff($newComplexes, $currentComplexes);
            
            // Complexes to remove (in current but not in new)
            $complexesToRemove = array_diff($currentComplexes, $newComplexes);
            
            // Remove complexes that aren't in the new selection
            if (!empty($complexesToRemove)) {
                $placeholders = implode(',', array_fill(0, count($complexesToRemove), '?'));
                $deleteStmt = $pdo->prepare("
                    DELETE FROM Employee_At_Complex 
                    WHERE ESSN = ? AND Complex_Number IN ({$placeholders})
                ");
                
                // Prepare the parameters array with ESSN as first element
                $params = array_merge([$essn], $complexesToRemove);
                
                $deleteStmt->execute($params);
                error_log("Removed employee from " . count($complexesToRemove) . " complexes");
            }
            
            // Add new complex assignments using UPSERT pattern
            if (!empty($complexesToAdd)) {
                // For multiple complexes
                if (count($complexesToAdd) > 1) {
                    // For PostgreSQL batch insert
                    $insertValues = [];
                    $insertParams = [];
                    
                    foreach ($complexesToAdd as $i => $complexNumber) {
                        $paramIndex = $i * 2;
                        $insertValues[] = "($" . ($paramIndex + 1) . ", $" . ($paramIndex + 2) . ")";
                        $insertParams[] = $essn;
                        $insertParams[] = $complexNumber;
                    }
                    
                    $sql = "INSERT INTO Employee_At_Complex (ESSN, Complex_Number) VALUES " . 
                           implode(', ', $insertValues) . 
                           " ON CONFLICT (ESSN, Complex_Number) DO NOTHING";
                    
                    $insertStmt = $pdo->prepare($sql);
                    $insertStmt->execute($insertParams);
                    
                    error_log("Batch added employee to " . count($complexesToAdd) . " complexes");
                } 
                // For a single complex
                else if (count($complexesToAdd) == 1) {
                    $complexNumber = $complexesToAdd[0];
                    $insertStmt = $pdo->prepare("
                        INSERT INTO Employee_At_Complex (ESSN, Complex_Number) 
                        VALUES (:essn, :complex_number)
                        ON CONFLICT (ESSN, Complex_Number) DO NOTHING
                    ");
                    
                    $insertStmt->execute([
                        ':essn' => $essn,
                        ':complex_number' => $complexNumber
                    ]);
                    
                    error_log("Added employee to complex: $complexNumber");
                }
            }
            
            error_log("Employee complex assignments updated successfully");
        } catch (PDOException $e) {
            error_log("Error updating works at complexes: " . $e->getMessage());
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Database error when updating complex assignments: ' . $e->getMessage()]);
            return;
        }
        
        // Update assigned projects (update Employee_Fix_Issue table)
        try {
            // Get the project assignments from the request
            $newAssignments = [];
            if (isset($data['assignedProjects'])) {
                // Ensure assignedProjects is an array
                if (is_array($data['assignedProjects'])) {
                    // Check the structure - we need projectId and complexNumber values
                    foreach ($data['assignedProjects'] as $project) {
                        if (is_array($project) && isset($project['projectId']) && isset($project['complexNumber'])) {
                            $newAssignments[] = $project;
                        } else if (is_string($project) || is_numeric($project)) {
                            // Handle case where only project IDs are passed, we'll need to get the complex
                            // Get the complex number for this project from Work_Order table
                            $projectInfoStmt = $pdo->prepare("
                                SELECT Project_ID, Complex_Number 
                                FROM Work_Order
                                WHERE Project_ID = :project_id
                            ");
                            $projectInfoStmt->execute([':project_id' => $project]);
                            $projectInfo = $projectInfoStmt->fetch(PDO::FETCH_ASSOC);
                            
                            if ($projectInfo) {
                                $newAssignments[] = [
                                    'projectId' => $projectInfo['Project_ID'],
                                    'complexNumber' => $projectInfo['Complex_Number']
                                ];
                            } else {
                                error_log("Warning: Could not find complex number for project ID: $project");
                            }
                        }
                    }
                }
            }
            
            // Get the current project assignments
            $currentAssignmentsStmt = $pdo->prepare("
                SELECT Project_ID, Complex_Number 
                FROM Employee_Fix_Issue 
                WHERE ESSN = :essn
            ");
            $currentAssignmentsStmt->execute([':essn' => $essn]);
            $currentAssignments = $currentAssignmentsStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format current assignments for easy comparison
            $formattedCurrentAssignments = [];
            foreach ($currentAssignments as $assignment) {
                $formattedCurrentAssignments[] = [
                    'projectId' => $assignment['Project_ID'],
                    'complexNumber' => $assignment['Complex_Number'],
                ];
            }
            
            // Find assignments to add (in new but not in current)
            $assignmentsToAdd = [];
            foreach ($newAssignments as $newAssignment) {
                $exists = false;
                foreach ($formattedCurrentAssignments as $currentAssignment) {
                    if ($newAssignment['projectId'] == $currentAssignment['projectId'] &&
                        $newAssignment['complexNumber'] == $currentAssignment['complexNumber']) {
                        $exists = true;
                        break;
                    }
                }
                if (!$exists) {
                    $assignmentsToAdd[] = $newAssignment;
                }
            }
            
            // Find assignments to remove (in current but not in new)
            $assignmentsToRemove = [];
            foreach ($formattedCurrentAssignments as $currentAssignment) {
                $exists = false;
                foreach ($newAssignments as $newAssignment) {
                    if ($newAssignment['projectId'] == $currentAssignment['projectId'] &&
                        $newAssignment['complexNumber'] == $currentAssignment['complexNumber']) {
                        $exists = true;
                        break;
                    }
                }
                if (!$exists) {
                    $assignmentsToRemove[] = $currentAssignment;
                }
            }
            
            // Remove projects that aren't in the new selection
            if (!empty($assignmentsToRemove)) {
                foreach ($assignmentsToRemove as $assignment) {
                    $deleteStmt = $pdo->prepare("
                        DELETE FROM Employee_Fix_Issue 
                        WHERE ESSN = :essn 
                        AND Project_ID = :project_id 
                        AND Complex_Number = :complex_number
                    ");
                    $deleteStmt->execute([
                        ':essn' => $essn,
                        ':project_id' => $assignment['projectId'],
                        ':complex_number' => $assignment['complexNumber']
                    ]);
                    error_log("Removed employee from project: {$assignment['projectId']} at complex: {$assignment['complexNumber']}");
                }
            }
            
            // Add new project assignments using UPSERT pattern
            if (!empty($assignmentsToAdd)) {
                $insertStmt = $pdo->prepare("
                    INSERT INTO Employee_Fix_Issue (ESSN, Project_ID, Complex_Number) 
                    VALUES (:essn, :project_id, :complex_number)
                    ON CONFLICT (ESSN, Project_ID, Complex_Number) DO NOTHING
                ");
                
                foreach ($assignmentsToAdd as $assignment) {
                    $insertStmt->execute([
                        ':essn' => $essn,
                        ':project_id' => $assignment['projectId'],
                        ':complex_number' => $assignment['complexNumber']
                    ]);
                    error_log("Added employee to project: {$assignment['projectId']} at complex: {$assignment['complexNumber']}");
                }
            }
            
            error_log("Employee project assignments updated successfully");
        } catch (PDOException $e) {
            error_log("Error updating assigned projects: " . $e->getMessage());
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Database error when updating project assignments: ' . $e->getMessage()]);
            return;
        }
        
        // Commit transaction
        $pdo->commit();
        
        error_log("Employee update completed successfully for: " . $essn);
        
        // Check if we kept any complexes due to NOT NULL constraint
        $keptManagedComplexes = array_diff($newManagedComplexes, $data['managedComplexes']);
        if (!empty($keptManagedComplexes)) {
            error_log("Kept the following complexes due to NOT NULL constraint: " . json_encode($keptManagedComplexes));
            echo json_encode([
                'success' => true,
                'keptManagedComplexes' => array_values($keptManagedComplexes) // Convert to indexed array for JSON
            ]);
        } else {
            echo json_encode(['success' => true]);
        }
    } catch (PDOException $e) {
        // Rollback transaction on error
        $pdo->rollBack();
        error_log("Error in updateEmployee: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    } catch (Exception $e) {
        // Rollback transaction on general error
        $pdo->rollBack();
        error_log("General error in updateEmployee: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        http_response_code(500);
    }
}

// Function to add a new employee
function addEmployee() {
    global $pdo;
    
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid request data']);
        return;
    }
    
    try {
        // Start transaction
        $pdo->beginTransaction();
        
        // Format ESSN properly - ensure it's exactly 11 characters (XXX-XX-XXXX format)
        $essn = $data['essn'];
        // First remove any existing dashes
        $essn = preg_replace('/[^0-9]/', '', $essn);
        // Ensure it's 9 digits long
        if (strlen($essn) != 9) {
            $pdo->rollBack();
            error_log("Invalid ESSN format, must be 9 digits: " . $essn);
            http_response_code(400);
            echo json_encode(['error' => 'Invalid ESSN format, must be 9 digits']);
            return;
        }
        // Format with dashes to match XXX-XX-XXXX (11 characters total)
        $essn = preg_replace('/^(\d{3})(\d{2})(\d{4})$/', '$1-$2-$3', $essn);
        
        error_log("Formatted ESSN (should be XXX-XX-XXXX format): " . $essn);
        
        // Insert new employee using UPSERT pattern (INSERT with ON CONFLICT DO UPDATE)
        // This allows us to update if the employee already exists
        $stmt = $pdo->prepare("
            INSERT INTO Employee (ESSN, Name, Salary)
            VALUES (:essn, :name, :salary)
            ON CONFLICT (ESSN) 
            DO UPDATE SET 
                Name = EXCLUDED.Name,
                Salary = EXCLUDED.Salary
            RETURNING *
        ");
        
        $stmt->execute([
            ':essn' => $essn,
            ':name' => $data['name'],
            ':salary' => $data['salary']
        ]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$result) {
            $pdo->rollBack();
            error_log("Failed to insert/update employee with ESSN: " . $essn);
            http_response_code(500);
            echo json_encode(['error' => 'Failed to insert/update employee record']);
            return;
        }
        
        error_log("Employee " . (isset($data['isNew']) ? "inserted" : "updated") . " successfully: " . $essn);
        
        // Add works at complexes
        if (isset($data['worksAtComplexes']) && !empty($data['worksAtComplexes'])) {
            try {
                // Use a more efficient batch insert approach if there are multiple complexes
                if (count($data['worksAtComplexes']) > 1) {
                    // For PostgreSQL batch insert
                    $placeholders = [];
                    $params = [];
                    $index = 1; // PostgreSQL uses numbered parameters
                    
                    foreach ($data['worksAtComplexes'] as $complexNumber) {
                        $placeholders[] = "($" . $index . ", $" . ($index + 1) . ")";
                        $params[] = $essn;
                        $params[] = $complexNumber;
                        $index += 2;
                    }
                    
                    $sql = "INSERT INTO Employee_At_Complex (ESSN, Complex_Number) VALUES " . 
                           implode(', ', $placeholders) . 
                           " ON CONFLICT (ESSN, Complex_Number) DO NOTHING";
                    
                    $insertStmt = $pdo->prepare($sql);
                    $insertStmt->execute($params);
                    
                    error_log("Batch added employee complexes: " . count($data['worksAtComplexes']));
                }
                // For a single complex, use the regular insert
                else {
                    $insertStmt = $pdo->prepare("
                        INSERT INTO Employee_At_Complex (ESSN, Complex_Number) 
                        VALUES (:essn, :complex_number)
                        ON CONFLICT (ESSN, Complex_Number) DO NOTHING
                    ");
                    
                    $insertStmt->execute([
                        ':essn' => $essn,
                        ':complex_number' => $data['worksAtComplexes'][0]
                    ]);
                    
                    $result = $insertStmt->fetch(PDO::FETCH_ASSOC);
                    if ($result) {
                        error_log("Added employee to complex: {$data['worksAtComplexes'][0]}");
                    } else {
                        error_log("Employee already assigned to complex: {$data['worksAtComplexes'][0]}");
                    }
                }
            } catch (PDOException $e) {
                error_log("Error adding complex assignments: " . $e->getMessage());
                throw $e;
            }
        }
        
        // Add assigned projects
        if (isset($data['assignedProjects']) && !empty($data['assignedProjects'])) {
            try {
                // Use a more efficient batch insert approach if there are multiple projects
                if (count($data['assignedProjects']) > 1) {
                    // For PostgreSQL, we need to explicitly specify parameter types
                    $placeholders = [];
                    $params = [];
                    $index = 1; // PostgreSQL uses numbered parameters
                    
                    foreach ($data['assignedProjects'] as $project) {
                        $placeholders[] = "($" . $index . ", $" . ($index + 1) . ", $" . ($index + 2) . ")";
                        $params[] = $essn;
                        $params[] = $project['projectId'];
                        $params[] = $project['complexNumber'];
                        $index += 3;
                    }
                    
                    $sql = "INSERT INTO Employee_Fix_Issue (ESSN, Project_ID, Complex_Number) VALUES " . 
                           implode(', ', $placeholders) . 
                           " ON CONFLICT (ESSN, Project_ID, Complex_Number) DO NOTHING";
                    
                    $insertStmt = $pdo->prepare($sql);
                    $insertStmt->execute($params);
                    
                    error_log("Batch added employee projects: " . count($data['assignedProjects']));
                }
                // For a single project, use the regular insert
                else {
                    $project = $data['assignedProjects'][0];
                    $insertStmt = $pdo->prepare("
                        INSERT INTO Employee_Fix_Issue (ESSN, Project_ID, Complex_Number) 
                        VALUES (:essn, :project_id, :complex_number)
                        ON CONFLICT (ESSN, Project_ID, Complex_Number) DO NOTHING
                        RETURNING *
                    ");
                    
                    $insertStmt->execute([
                        ':essn' => $essn,
                        ':project_id' => $project['projectId'],
                        ':complex_number' => $project['complexNumber']
                    ]);
                    
                    $result = $insertStmt->fetch(PDO::FETCH_ASSOC);
                    if ($result) {
                        error_log("Assigned employee to project: {$project['projectId']} at complex: {$project['complexNumber']}");
                    } else {
                        error_log("Employee already assigned to project: {$project['projectId']} at complex: {$project['complexNumber']}");
                    }
                }
            } catch (PDOException $e) {
                error_log("Error adding project assignments: " . $e->getMessage());
                throw $e;
            }
        }
        
        // Commit transaction
        $pdo->commit();
        
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        // Rollback transaction on error
        $pdo->rollBack();
        error_log("Error in addEmployee: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Function to delete an employee
function deleteEmployee() {
    global $pdo;
    
    // Only accept POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed. Use POST.']);
        return;
    }
    
    // Get POST data
    $raw_input = file_get_contents('php://input');
    error_log("Raw input for delete employee: " . $raw_input);
    
    $data = json_decode($raw_input, true);
    
    if (!$data) {
        $json_error = json_last_error_msg();
        error_log("JSON decode error: " . $json_error);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid request data: ' . $json_error]);
        return;
    }
    
    // Validate required fields
    if (empty($data['essn'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required field: ESSN']);
        return;
    }
    
    // Clean the ESSN (remove any non-digit characters)
    $essn = preg_replace('/\D/', '', $data['essn']);
    
    // Validate ESSN format (should be 9 digits)
    if (strlen($essn) !== 9) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid ESSN format. Must be 9 digits.']);
        return;
    }
    
    try {
        // Begin transaction
        $pdo->beginTransaction();
        
        // Format ESSN with dashes for database lookup (XXX-XX-XXXX format)
        $formattedEssn = preg_replace('/^(\d{3})(\d{2})(\d{4})$/', '$1-$2-$3', $essn);
        error_log("Deleting employee with formatted ESSN: " . $formattedEssn);
        
        // First, check if employee exists
        $checkStmt = $pdo->prepare("SELECT Name FROM Employee WHERE ESSN = ?");
        $checkStmt->execute([$formattedEssn]);
        $employee = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$employee) {
            // Employee not found
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Employee not found with ESSN: ' . $formattedEssn]);
            return;
        }
        
        // Drop the foreign key constraint that prevents deletion
        $pdo->exec("ALTER TABLE Apartment_Complex DROP CONSTRAINT IF EXISTS apartment_complex_manager_fkey");
        error_log("Dropped apartment_complex_manager_fkey constraint");
        
        // Also drop the foreign key constraint on Employee_Fix_Issue
        $pdo->exec("ALTER TABLE Employee_Fix_Issue DROP CONSTRAINT IF EXISTS employee_fix_issue_essn_fkey");
        error_log("Dropped employee_fix_issue_essn_fkey constraint");
        
        // Delete records from Employee_At_Complex table
        $worksAtStmt = $pdo->prepare("DELETE FROM Employee_At_Complex WHERE ESSN = ?");
        $worksAtStmt->execute([$formattedEssn]);
        $worksAtCount = $worksAtStmt->rowCount();
        error_log("Deleted $worksAtCount Employee_At_Complex records");
        
        // Delete records from Employee_Fix_Issue table
        $worksOnStmt = $pdo->prepare("DELETE FROM Employee_Fix_Issue WHERE ESSN = ?");
        $worksOnStmt->execute([$formattedEssn]);
        $worksOnCount = $worksOnStmt->rowCount();
        error_log("Deleted $worksOnCount Employee_Fix_Issue records");
        
        // Now delete the employee directly
        $deleteStmt = $pdo->prepare("DELETE FROM Employee WHERE ESSN = ?");
        $deleteStmt->execute([$formattedEssn]);
        
        // Check if delete was successful
        if ($deleteStmt->rowCount() === 0) {
            // No rows affected, something went wrong
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to delete employee. No rows affected.']);
            return;
        }
        
        // Recreate the constraint with NULL option for Apartment_Complex
        $pdo->exec("
            ALTER TABLE Apartment_Complex 
            ADD CONSTRAINT apartment_complex_manager_fkey 
            FOREIGN KEY (Manager) REFERENCES Employee(ESSN) ON DELETE SET NULL
        ");
        error_log("Restored apartment_complex_manager_fkey constraint with ON DELETE SET NULL");
        
        // Recreate the constraint with NULL option for Employee_Fix_Issue
        $pdo->exec("
            ALTER TABLE Employee_Fix_Issue 
            ADD CONSTRAINT employee_fix_issue_essn_fkey 
            FOREIGN KEY (ESSN) REFERENCES Employee(ESSN) ON DELETE SET NULL
        ");
        error_log("Restored employee_fix_issue_essn_fkey constraint with ON DELETE SET NULL");
        
        // Commit the transaction
        $pdo->commit();
        
        // Return success
        echo json_encode([
            'success' => true, 
            'message' => 'Employee deleted successfully',
            'employeeName' => $employee['Name'],
            'worksAtCount' => $worksAtCount,
            'worksOnCount' => $worksOnCount
        ]);
        
    } catch (PDOException $e) {
        // Roll back the transaction on error
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        
        error_log("Error deleting employee: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

// Function to update a complex's manager
function updateComplexManager() {
    global $pdo;
    
    // Only accept POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed. Use POST.']);
        return;
    }
    
    // Get POST data
    $raw_input = file_get_contents('php://input');
    error_log("Raw input for update complex manager: " . $raw_input);
    
    $data = json_decode($raw_input, true);
    
    if (!$data) {
        $json_error = json_last_error_msg();
        error_log("JSON decode error: " . $json_error);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid request data: ' . $json_error]);
        return;
    }
    
    // Validate required fields
    if (empty($data['complexNumber']) || empty($data['managerEssn'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required fields: Complex Number and Manager ESSN are required']);
        return;
    }
    
    $complexNumber = $data['complexNumber'];
    
    // Format ESSN properly - ensure it's exactly 11 characters (XXX-XX-XXXX format)
    $essn = $data['managerEssn'];
    // First remove any existing dashes
    $essn = preg_replace('/[^0-9]/', '', $essn);
    // Ensure it's 9 digits long
    if (strlen($essn) != 9) {
        error_log("Invalid ESSN format, must be 9 digits: " . $essn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid ESSN format, must be 9 digits']);
        return;
    }
    // Format with dashes to match XXX-XX-XXXX (11 characters total)
    $essn = preg_replace('/^(\d{3})(\d{2})(\d{4})$/', '$1-$2-$3', $essn);
    
    try {
        // Begin transaction
        $pdo->beginTransaction();
        
        // First, check if the complex exists
        $checkComplexStmt = $pdo->prepare("SELECT Complex_Number FROM Apartment_Complex WHERE Complex_Number = ?");
        $checkComplexStmt->execute([$complexNumber]);
        $complex = $checkComplexStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$complex) {
            // Complex not found
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Complex not found with number: ' . $complexNumber]);
            return;
        }
        
        // Check if the employee exists
        $checkEmployeeStmt = $pdo->prepare("SELECT ESSN, Name FROM Employee WHERE ESSN = ?");
        $checkEmployeeStmt->execute([$essn]);
        $employee = $checkEmployeeStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$employee) {
            // Employee not found
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Employee not found with ESSN: ' . $essn]);
            return;
        }
        
        // Update the complex's manager
        $updateStmt = $pdo->prepare("
            UPDATE Apartment_Complex 
            SET Manager = ?
            WHERE Complex_Number = ?
        ");
        $updateStmt->execute([$essn, $complexNumber]);
        
        // Check if update was successful
        if ($updateStmt->rowCount() === 0) {
            // No rows affected, something went wrong
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to update complex manager. No rows affected.']);
            return;
        }
        
        // Commit the transaction
        $pdo->commit();
        
        // Return success with manager name for UI feedback
        echo json_encode([
            'success' => true, 
            'message' => 'Complex manager updated successfully',
            'managerName' => $employee['Name'],
            'managerEssn' => $employee['ESSN']
        ]);
        
    } catch (PDOException $e) {
        // Roll back the transaction on error
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        
        error_log("Error updating complex manager: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}
?> 