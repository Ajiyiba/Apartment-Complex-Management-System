# Server-Side Implementation for Property Management System

This directory contains the server-side implementation for the Property Management System. It provides API endpoints that allow the frontend to access data from the PostgreSQL database.

## Files

- `db_config.php`: Database connection configuration
- `api.php`: API endpoints for retrieving data
- `.htaccess`: Configuration for API access and routing

## Setup Instructions

1. **Database Configuration**
   
   Update the database connection details in `db_config.php`:
   ```php
   $host = "localhost";      // Your database host
   $dbname = "property_management"; // Your database name
   $user = "postgres";       // Your database username
   $password = "postgres";   // Your database password
   $port = "5432";           // Your database port
   ```

2. **Web Server Configuration**
   
   Make sure your web server (Apache/Nginx) is properly configured to:
   - Allow .htaccess files for the API routing
   - Have PHP with PDO and PostgreSQL extensions enabled

3. **File Permissions**
   
   Ensure that the web server has appropriate permissions to read and execute these files.

## API Endpoints

All endpoints are accessed through `api.php` with the `endpoint` parameter:

- `api.php?endpoint=complexes`: Get all apartment complexes
- `api.php?endpoint=apartments`: Get all apartments with complex info
- `api.php?endpoint=renters`: Get all renters with apartment info
- `api.php?endpoint=employees`: Get all employees
- `api.php?endpoint=maintenance_requests`: Get all maintenance requests
- `api.php?endpoint=projects`: Get all projects (work orders)
- `api.php?endpoint=leases`: Get all leases
- `api.php?endpoint=dashboard_stats`: Get dashboard overview statistics

## Response Format

All API endpoints return JSON responses in the following format:

```json
{
  "success": true,
  "data": [
    // Array of data objects
  ]
}
```

Or in case of an error:

```json
{
  "error": "Error message"
}
```

## Security Considerations

This implementation includes basic security measures, but in a production environment, consider:
- Implementing proper authentication/authorization
- Using HTTPS
- Adding input validation
- Implementing rate limiting
- Adding more comprehensive error handling 