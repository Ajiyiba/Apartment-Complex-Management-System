<?php
// Include database configuration
require_once 'db_config.php';

// Set headers for JSON display
header('Content-Type: application/json');

// Function to get apartments with their complex info
function getApartments() {
    global $pdo;
    try {
        $stmt = $pdo->prepare("
            SELECT a.*, ac.Street, ac.City, ac.Addr_State
            FROM Apartment a
            JOIN Apartment_Complex ac ON a.Complex_Number = ac.Complex_Number
        ");
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $results], JSON_PRETTY_PRINT);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Execute the function
getApartments();
?>