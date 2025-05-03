<?php
// Turn off error display to prevent HTML errors in JSON response
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Database configuration
$host = "localhost";
$dbname = "property_management";
$user = "postgres";     // Update this with your actual database username
$password = "1977"; // Update this with your actual database password
$port = "5432";         // Default PostgreSQL port

// Establish database connection
try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;user=$user;password=$password";
    // Make the connection persistent for better performance
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_PERSISTENT => true
    ];
    $pdo = new PDO($dsn, $user, $password, $options);
    
    // Connection successful
    // echo "Connected to the $dbname database successfully!";
} catch (PDOException $e) {
    // Log the error instead of displaying it
    error_log("Database connection failed: " . $e->getMessage());
    
    // If this is included directly, return a JSON error
    if (basename($_SERVER['PHP_SELF']) === 'db_config.php') {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed']);
    } else {
        // Otherwise let the parent script handle the error
        throw $e;
    }
    exit;
}
?> 