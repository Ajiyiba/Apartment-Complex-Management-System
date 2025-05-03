<?php
// Test API response format consistency

header('Content-Type: text/html');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Response Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2 {
            color: #333;
        }
        pre {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        .endpoint {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #ddd;
        }
        .success {
            color: green;
            font-weight: bold;
        }
        .error {
            color: red;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <h1>API Response Test</h1>
    <p>Testing the consistency of property names in API responses</p>
    
    <?php
    $endpoints = [
        'complexes' => 'Complex Data',
        'apartments' => 'Apartments Data',
        'renters' => 'Renters Data',
        'employees' => 'Employees Data',
        'maintenance_requests' => 'Maintenance Requests',
        'projects' => 'Projects Data',
        'leases' => 'Leases Data',
        'dashboard_stats' => 'Dashboard Statistics'
    ];
    
    foreach ($endpoints as $endpoint => $title) {
        echo "<div class='endpoint'>";
        echo "<h2>$title</h2>";
        echo "<p>Endpoint: <code>api.php?endpoint=$endpoint</code></p>";
        
        // Fetch the API response
        $api_url = "http://localhost/property_management/server/api.php?endpoint=$endpoint";
        
        try {
            $context = stream_context_create([
                'http' => [
                    'timeout' => 5 // 5 second timeout
                ]
            ]);
            
            $response = @file_get_contents($api_url, false, $context);
            
            if ($response === false) {
                echo "<p class='error'>Failed to fetch API response</p>";
                continue;
            }
            
            $data = json_decode($response, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                echo "<p class='error'>Failed to parse JSON response: " . json_last_error_msg() . "</p>";
                continue;
            }
            
            // Replace the data processing section with this:
if (isset($data['success']) && $data['success'] === true) {
    echo "<p class='success'>API request successful</p>";
    
    // Check for data
    if (isset($data['data']) && !empty($data['data'])) {
        // Special handling for dashboard_stats which is an object, not an array of objects
        if ($endpoint === 'dashboard_stats') {
            echo "<p>Dashboard stats property names:</p>";
            echo "<pre>";
            echo json_encode(array_keys($data['data']), JSON_PRETTY_PRINT);
            echo "</pre>";
            
            echo "<p>Dashboard stats full contents:</p>";
            echo "<pre>" . json_encode($data['data'], JSON_PRETTY_PRINT) . "</pre>";
        }
        // For arrays (all other endpoints), display the first item if available
        else if (is_array($data['data']) && count($data['data']) > 0) {
            $first_item = $data['data'][0];
            
            echo "<p>First data item property names:</p>";
            echo "<pre>";
            echo json_encode(array_keys($first_item), JSON_PRETTY_PRINT);
            echo "</pre>";
            
            echo "<p>First data item full contents:</p>";
            echo "<pre>" . json_encode($first_item, JSON_PRETTY_PRINT) . "</pre>";
        } 
        else {
            echo "<p>No data items returned (empty array)</p>";
        }
    } else {
        echo "<p>No data in response</p>";
    }
} else {
    echo "<p class='error'>API request failed: " . ($data['error'] ?? 'Unknown error') . "</p>";
}
            
        } catch (Exception $e) {
            echo "<p class='error'>Exception: " . $e->getMessage() . "</p>";
        }
        
        echo "</div>";
    }
    ?>

</body>
</html> 