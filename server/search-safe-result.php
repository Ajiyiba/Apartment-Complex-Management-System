<?php
// Include database configuration
require_once '../server/db_config.php';

// Get the search parameter
$search = isset($_GET['search']) ? $_GET['search'] : '';

// Construct a safe SQL query using prepared statements with exact match
$query = "SELECT * FROM Employee WHERE LOWER(Name) = LOWER(:search)";

echo "<h3>Query prepared: " . htmlspecialchars($query) . "</h3>";
echo "<p>Searching for exact match (case insensitive): <strong>" . htmlspecialchars($search) . "</strong></p>";

try {
    // Prepare the statement
    $stmt = $pdo->prepare($query);
    
    // Bind parameters with exact match (not using LIKE operator)
    $stmt->bindParam(':search', $search, PDO::PARAM_STR);
    
    // Execute the query
    $stmt->execute();
    
    // Fetch results
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Display results
    echo "<h2>Search Results</h2>";
    if (count($results) > 0) {
        echo "<table border='1'>";
        echo "<tr><th>ESSN</th><th>Name</th><th>Salary</th></tr>";
        
        foreach ($results as $row) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($row['essn']) . "</td>";
            echo "<td>" . htmlspecialchars($row['name']) . "</td>";
            echo "<td>" . htmlspecialchars($row['salary']) . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
    } else {
        echo "No results found.";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>