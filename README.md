# Property Management System

A web-based property management system that allows both employees and residents to manage properties, maintenance requests, and communications efficiently.

## Features

- **Employee Interface**
  - Property management
  - Maintenance request handling
  - Resident communication
  - Document management
  - Reporting and analytics

- **Resident Interface**
  - Maintenance request submission
  - Document access
  - Communication with management
  - Account management

## Database Integration

This system now uses a PostgreSQL database to store and retrieve real data. The database schema includes:

- Apartment complexes and individual apartments
- Employees and their assignments
- Renters and their lease agreements
- Maintenance requests and work orders
- Development projects and contractor commissions

The integration allows for real-time data retrieval and updates through the web interface.

## Installation

1. **Prerequisites**
   - A modern web browser (Chrome, Firefox, Safari, or Edge)
   - Web server (Apache, Nginx, or similar) with PHP 7.x or higher
   - PostgreSQL 10.x or higher
   - PHP with PDO and PostgreSQL extensions enabled

2. **Database Setup**
   - Create a PostgreSQL database named `property_management`
   - Import the schema using the `create.sql` script
   - Configure your database connection settings
   - Verify the database schema is correctly created

3. **Server Setup**
   - Update database connection details in `server/db_config.php`:
     ```php
     $host = "localhost";      // Your database host
     $dbname = "property_management"; // Your database name
     $user = "postgres";       // Your database username
     $password = "postgres";   // Your database password
     $port = "5432";           // Your database port
     ```
   - Ensure the web server user has permissions to read/write to the server directory

4. **Web Setup**
   - Clone or download this repository to your local machine
   - Place the files in your web server's root directory
   - Ensure the following directory structure is maintained:
     ```
     property-management-system/
     ├── css/
     │   ├── main.css
     │   └── resident.css
     ├── js/
     │   ├── api.js
     │   ├── employee.js
     │   ├── main.js
     │   └── resident.js
     ├── server/
     │   ├── api.php
     │   ├── db_config.php
     │   ├── update-process.php
     │   ├── search-result.php
     │   ├── search-safe-result.php
     │   ├── test_connection.php
     │   ├── test_db.php
     │   ├── .htaccess
     │   └── README.md
     ├── employee/
     │   ├── add-employee.html
     │   ├── add-renter.html
     │   ├── assign-lease.html
     │   ├── commission-contractor.html
     │   ├── create-project.html
     │   ├── dashboard.html
     │   ├── login.html
     │   ├── manage-complex.html
     │   ├── register.html
     │   ├── search-safe.html
     │   ├── search-vulnerable.html
     │   └── update-vulnerable.html
     ├── resident/
     │   ├── dashboard.html
     │   ├── login.html
     │   ├── register.html
     │   └── report-issue.html
     ├── create.sql
     └── index.html
     ```

## Usage

### For Employees

1. **Registration**
   - Navigate to the employee registration page
   - Fill in your details:
     - Full Name
     - Email
     - Phone Number
     - Role (Admin/Manager/Agent/Maintenance)
     - Location
     - Password
   - Click "Register" to create your account

2. **Login**
   - Go to the employee login page
   - Enter your email and password
   - Click "Login" to access the system

3. **Features**
   - View and manage properties from the database
   - Handle maintenance requests with real-time updates
   - Filter data by location
   - Add new employees and residents to the database
   - Create and assign real leases to residents
   - Manage work orders and development projects
   - Commission contractors for projects

### For Residents

1. **Registration**
   - Navigate to the resident registration page
   - Fill in your details:
     - Full Name
     - Email
     - Phone Number
     - Unit Number
     - Building
     - Move-in Date
     - Password
   - Click "Register" to create your account

2. **Login**
   - Go to the resident login page
   - Enter your email and password
   - Click "Login" to access the system

3. **Features**
   - Submit maintenance requests that are stored in the database
   - Access lease information from the database
   - Manage your account details
   - View accurate apartment information

## Data Validation

The system includes validation mechanisms to ensure data integrity:
- Server-side validation in PHP API endpoints
- Client-side validation using JavaScript
- Database constraints and foreign key relationships
- Input sanitization to prevent SQL injection

## Security

- All passwords are securely hashed
- HTTPS is recommended for production deployment
- Database credentials should be kept secure
- Regular security updates are recommended

## Browser Compatibility

The system is compatible with:
- Google Chrome (latest version)
- Mozilla Firefox (latest version)
- Safari (latest version)
- Microsoft Edge (latest version)

## Support

For technical support or questions, please contact the system administrator.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Version

Current Version: 2.0.0
Last Updated: 2025

## Issues Fixed

### 1. Employee Management - Complex Deselection Issue
- **Problem**: Could not deselect managed complexes in employee edit form due to NOT NULL constraint on Manager column.
- **Solution**:
  - Implemented substitute manager assignment when removing management assignments
  - Added appropriate error handling with clear user messages
  - Enhanced client-side validation and feedback

### 2. Transaction Management
- **Problem**: Database errors weren't properly rolled back, causing "In failed SQL transaction" errors.
- **Solution**:
  - Improved transaction management with proper rollbacks
  - Enhanced error handling in each section of the update process
  - Updated response formatting to include details about kept complexes

### 3. Work-At Complexes TypeError
- **Problem**: TypeError "Cannot access offset of type string on string" when editing work-at complexes.
- **Solution**:
  - Added proper type checking for worksAtComplexes data
  - Improved array handling in PostgreSQL batch inserts
  - Enhanced project assignment handling to include complex numbers
  - Implemented robust error handling for different data formats

## Technology Stack
- Backend: PHP with PostgreSQL database
- Frontend: JavaScript/HTML/CSS

## Maintenance Guidelines
- Maintain data integrity constraints when implementing employee management features
- Always use transaction management for multi-step database operations
- Implement proper type checking for all data coming from client-side forms
- Provide clear error messages to users when constraints prevent operations 