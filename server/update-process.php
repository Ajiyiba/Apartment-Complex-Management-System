<?php
// Include database configuration
require_once '../server/db_config.php';

// Get the input parameters
$essn = isset($_POST['essn']) ? $_POST['essn'] : '';
$salary = isset($_POST['salary']) ? $_POST['salary'] : '';
$name = isset($_POST['name']) ? $_POST['name'] : '';
$searchName = isset($_POST['searchName']) ? $_POST['searchName'] : '';

// Create a more vulnerable query without thorough data validation
$query = "UPDATE Employee SET ";

// Only add fields that are provided
if (!empty($salary)) {
    $query .= "Salary = '" . $salary . "'";
}

if (!empty($name)) {
    // Add comma if salary was also included
    if (!empty($salary)) {
        $query .= ", ";
    }
    $query .= "Name = '" . $name . "'";
}

// Finish the query with minimal WHERE clause validation
$query .= " WHERE 1=1";

// Build WHERE clause for retrieval of updated rows
$whereClause = " WHERE 1=1";

// If searchName is provided, use it in the WHERE clause (even partial)
if (!empty($searchName)) {
    $query .= " AND Name LIKE '%" . $searchName . "%'";
    $whereClause .= " AND Name LIKE '%" . $searchName . "%'";
}
// Fall back to ESSN if provided
else if (!empty($essn)) {
    $query .= " AND ESSN = '" . $essn . "'";
    $whereClause .= " AND ESSN = '" . $essn . "'";
}

echo "<h3>Query executed (vulnerable): " . htmlspecialchars($query) . "</h3>";

try {
    // Execute the query without proper validation
    $stmt = $pdo->exec($query);
    
    echo "<h2>Update Result</h2>";
    echo "<p>Affected rows: " . $stmt . "</p>";
    
    // Retrieve and display all updated rows
    $selectQuery = "SELECT * FROM Employee" . $whereClause;
    echo "<p>Retrieving updated records using: " . htmlspecialchars($selectQuery) . "</p>";
    
    $retrieveStmt = $pdo->query($selectQuery);
    $updatedRows = $retrieveStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($updatedRows) > 0) {
        echo "<h3>Updated Employee Records:</h3>";
        echo "<table border='1' cellpadding='5'>";
        echo "<tr><th>ESSN</th><th>Name</th><th>Salary</th></tr>";
        
        foreach ($updatedRows as $row) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($row['essn']) . "</td>";
            echo "<td>" . htmlspecialchars($row['name']) . "</td>";
            echo "<td>" . htmlspecialchars($row['salary']) . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
    } else {
        echo "<p>No matching records found after update.</p>";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>