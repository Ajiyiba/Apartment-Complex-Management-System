<?php
// Include database configuration
require_once '../server/db_config.php';

// Get the search parameter
$search = isset($_GET['search']) ? $_GET['search'] : '';

// Construct a vulnerable SQL query (NEVER do this in real applications)
$query = "SELECT * FROM Employee WHERE 1=1 AND Name LIKE '%" . $search . "%'";

echo "<h3>Query executed: " . htmlspecialchars($query) . "</h3>";

try {
    // Execute the query
    $stmt = $pdo->query($query);
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