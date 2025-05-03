// API utility functions

// Base URL for API endpoints
const API_BASE_URL = '../server/api.php';

/**
 * Generic function to fetch data from an API endpoint
 * @param {string} endpoint - The endpoint to fetch data from
 * @param {Object} options - Optional fetch options (method, headers, body)
 * @returns {Promise} - Promise that resolves to the JSON response
 */
async function fetchFromAPI(endpoint, options = {}) {
    try {
        const url = `${API_BASE_URL}?endpoint=${endpoint}`;
        console.log(`Fetching from ${url} with options:`, options);
        
        const response = await fetch(url, options);
        console.log(`Response status from ${endpoint}:`, response.status);
        
        // Check if the response is JSON format by examining Content-Type header
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            // If not JSON, get text and log it
            const textResponse = await response.text();
            console.error(`Non-JSON response received from ${endpoint}:`, textResponse);
            throw new Error(`Expected JSON response but got: ${textResponse.substring(0, 200)}...`);
        }
        
        // Parse JSON response
        const data = await response.json();
        console.log(`Response data from ${endpoint}:`, data);
        
        if (!response.ok) {
            console.error(`HTTP error from ${endpoint}:`, response.status, data);
            throw new Error(data.error || `Error ${response.status} fetching from ${endpoint}`);
        }
        
        if (!data.success && data.error) {
            console.error(`API error from ${endpoint}:`, data.error);
            throw new Error(data.error || `API error from ${endpoint}`);
        }
        
        return data;
    } catch (error) {
        console.error(`Error fetching from ${endpoint}:`, error);
        
        // Enhance error message with endpoint information
        const enhancedError = new Error(`API Error (${endpoint}): ${error.message}`);
        enhancedError.originalError = error;
        throw enhancedError;
    }
}

// Specific API endpoint functions

/**
 * Get dashboard statistics
 * @returns {Promise} - Promise that resolves to dashboard stats
 */
async function getDashboardStats() {
    return fetchFromAPI('dashboard_stats');
}

/**
 * Get all complexes
 * @param {boolean} forceRefresh - Whether to force a fresh fetch from the server
 * @returns {Promise} - Promise that resolves to complexes data
 */
async function getComplexes(forceRefresh = false) {
    // Add a timestamp to the URL to bypass cache if forceRefresh is true
    const endpoint = forceRefresh 
        ? `complexes?_=${new Date().getTime()}` 
        : 'complexes';
    
    const options = forceRefresh 
        ? { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } } 
        : {};
    
    try {
        return await fetchFromAPI(endpoint, options);
    } catch (error) {
        console.error('Error in getComplexes:', error);
        
        // Try a direct fetch as a fallback
        try {
            console.log('Attempting direct fetch fallback for complexes');
            const response = await fetch(`${API_BASE_URL}?endpoint=${endpoint}`, { 
                ...options,
                timeout: 10000 // 10 second timeout
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (fallbackError) {
            console.error('Fallback fetch also failed:', fallbackError);
            throw fallbackError; // Re-throw the error
        }
    }
}

/**
 * Get all apartments with complex info
 * @returns {Promise} - Promise that resolves to apartments data
 */
async function getApartments() {
    return fetchFromAPI('apartments');
}

/**
 * Get all renters with apartment info
 * @returns {Promise} - Promise that resolves to renters data
 */
async function getRenters() {
    return fetchFromAPI('renters');
}

/**
 * Get all employees
 * @param {boolean} forceRefresh - Whether to force a fresh fetch from the server
 * @returns {Promise} - Promise that resolves to employees data
 */
async function getEmployees(forceRefresh = false) {
    // Add a timestamp to the URL to bypass cache if forceRefresh is true
    const endpoint = forceRefresh 
        ? `employees?_=${new Date().getTime()}` 
        : 'employees';
    
    const options = forceRefresh 
        ? { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } } 
        : {};
    
    try {
        return await fetchFromAPI(endpoint, options);
    } catch (error) {
        console.error('Error in getEmployees:', error);
        
        // Try a direct fetch as a fallback
        try {
            console.log('Attempting direct fetch fallback for employees');
            const response = await fetch(`${API_BASE_URL}?endpoint=${endpoint}`, { 
                ...options,
                timeout: 10000 // 10 second timeout
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (fallbackError) {
            console.error('Fallback fetch also failed:', fallbackError);
            throw fallbackError; // Re-throw the error
        }
    }
}

/**
 * Get all maintenance requests
 * @returns {Promise} - Promise that resolves to maintenance requests data
 */
async function getMaintenanceRequests() {
    return fetchFromAPI('maintenance_requests');
}

/**
 * Get all projects
 * @returns {Promise} - Promise that resolves to projects data
 */
async function getProjects() {
    return fetchFromAPI('projects');
}

/**
 * Get all leases
 * @returns {Promise} - Promise that resolves to leases data
 */
async function getLeases() {
    return fetchFromAPI('leases');
}

/**
 * Get a single employee by ESSN
 * @param {string} essn - Employee SSN
 * @returns {Promise} - Promise that resolves to employee data
 */
async function getEmployee(essn) {
    console.log('Getting employee with ESSN:', essn);
    
    // Ensure ESSN is properly formatted (remove all non-digit characters)
    // The API expects a 9-digit SSN without dashes
    let urlSafeEssn = essn.replace(/\D/g, '');
    
    // Make sure we have exactly 9 digits
    if (urlSafeEssn.length !== 9) {
        console.error('Invalid ESSN format:', urlSafeEssn);
        throw new Error('Invalid ESSN format. Must be 9 digits.');
    }
    
    console.log('URL-safe ESSN for API call:', urlSafeEssn);
    
    return fetchFromAPI(`employee/${urlSafeEssn}`);
}

/**
 * Add a new employee
 * @param {Object} employeeData - Employee data to add
 * @returns {Promise} - Promise that resolves to add response
 */
async function addEmployee(employeeData) {
    try {
        const response = await fetch(`${API_BASE_URL}?endpoint=add_employee`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(employeeData)
        });
        
        const data = await response.json();
        console.log('Add employee response:', data);
        
        return data;
    } catch (error) {
        console.error('Error adding employee:', error);
        throw error;
    }
}

/**
 * Update employee data
 * @param {Object} employeeData - Employee data to update
 * @returns {Promise} - Promise that resolves to update response
 */
async function updateEmployee(employeeData) {
    try {
        console.log('Updating employee with data:', employeeData);
        
        // Ensure arrays are properly initialized even if empty
        if (!employeeData.managedComplexes) employeeData.managedComplexes = [];
        if (!employeeData.worksAtComplexes) employeeData.worksAtComplexes = [];
        if (!employeeData.assignedProjects) employeeData.assignedProjects = [];
        
        // Remove any dashes from SSN
        employeeData.essn = employeeData.essn.replace(/\D/g, '');
        
        const response = await fetch(`${API_BASE_URL}?endpoint=update_employee`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(employeeData)
        });
        
        const data = await response.json();
        console.log('Update employee response:', data);
        
        return data;
    } catch (error) {
        console.error('Error updating employee:', error);
        throw error;
    }
}

/**
 * Delete an employee
 * @param {string} essn - Employee SSN
 * @returns {Promise} - Promise that resolves to delete response
 */
async function deleteEmployee(essn) {
    try {
        console.log('Deleting employee with ESSN:', essn);
        
        if (!essn) {
            console.error('Cannot delete employee: Missing ESSN');
            throw new Error('Missing ESSN');
        }
        
        // Store original for logging
        const originalEssn = essn;
        
        // Remove any dashes from SSN
        essn = essn.replace(/\D/g, '');
        
        // Validate ESSN format (should be 9 digits)
        if (essn.length !== 9) {
            console.error('Invalid ESSN format, expected 9 digits but got:', essn.length);
            throw new Error(`Invalid ESSN format: ${originalEssn}. Must be 9 digits.`);
        }
        
        console.log('Formatted ESSN for API call (9 digits, no dashes):', essn);
        
        const response = await fetch(`${API_BASE_URL}?endpoint=delete_employee`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ essn: essn })
        });
        
        const data = await response.json();
        console.log('Delete employee response:', data);
        
        return data;
    } catch (error) {
        console.error('Error deleting employee:', error);
        throw error;
    }
}

/**
 * Update a complex's manager
 * @param {Object} complexData - Complex data containing complexNumber and managerEssn
 * @returns {Promise} - Promise that resolves to update response
 */
async function updateComplexManager(complexData) {
    try {
        console.log('Updating complex manager with data:', complexData);
        
        // Ensure required fields exist
        if (!complexData.complexNumber || !complexData.managerEssn) {
            throw new Error('Missing required fields: complexNumber and managerEssn');
        }
        
        // Remove any dashes from manager ESSN
        if (complexData.managerEssn) {
            complexData.managerEssn = complexData.managerEssn.replace(/\D/g, '');
        }
        
        const response = await fetch(`${API_BASE_URL}?endpoint=update_complex_manager`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(complexData)
        });
        
        const data = await response.json();
        console.log('Update complex manager response:', data);
        
        return data;
    } catch (error) {
        console.error('Error updating complex manager:', error);
        throw error;
    }
}

/**
 * Populates a table with data from an API endpoint
 * @param {string} tableId - The ID of the table to populate
 * @param {Array} data - The data to populate the table with
 * @param {Array} columns - The columns to display (field names)
 * @param {Array} headers - The headers to display (human-readable names)
 * @param {Function} rowCallback - Optional callback for each row to add custom elements
 * @param {Object} customFormatters - Optional object with column-keyed formatter functions
 */
function populateTable(tableId, data, columns, headers, rowCallback, customFormatters = {}) {
    console.log(`Populating table ${tableId} with ${data.length} rows`);
    console.log('Columns to display:', columns);
    console.log('Headers to display:', headers);
    
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`Table with ID ${tableId} not found`);
        return;
    }
    
    // Clear existing table
    const tbody = table.querySelector('tbody');
    if (tbody) tbody.remove();
    
    // Create thead if it doesn't exist
    let thead = table.querySelector('thead');
    if (!thead) {
        thead = document.createElement('thead');
        table.appendChild(thead);
    }
    
    // Create header row
    thead.innerHTML = '';
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    
    // Add action column header if callback is provided
    if (rowCallback) {
        const th = document.createElement('th');
        th.textContent = 'Actions';
        headerRow.appendChild(th);
    }
    
    thead.appendChild(headerRow);
    
    // Create new tbody
    const newTbody = document.createElement('tbody');
    
    // Log a sample row for debugging
    if (data.length > 0) {
        console.log('Sample row data:', data[0]);
    }
    
    // Add data rows
    data.forEach((item, rowIndex) => {
        const row = document.createElement('tr');
        
        columns.forEach((column, index) => {
            const td = document.createElement('td');
            
            // Check if the column exists in the data
            if (!(column in item) && rowIndex === 0) {
                console.warn(`Column "${column}" not found in data for table ${tableId}`);
            }
            
            // Use custom formatter if available for this column
            if (customFormatters && customFormatters[column]) {
                const formattedContent = customFormatters[column](item[column] || '', item);
                if (formattedContent instanceof Node) {
                    td.appendChild(formattedContent);
                } else {
                    td.innerHTML = formattedContent;
                }
            } else {
                td.textContent = item[column] || '';
            }
            
            row.appendChild(td);
        });
        
        // Add action buttons if callback is provided
        if (rowCallback) {
            const td = document.createElement('td');
            rowCallback(td, item);
            row.appendChild(td);
        }
        
        newTbody.appendChild(row);
    });
    
    table.appendChild(newTbody);
    console.log(`Table ${tableId} populated successfully`);
} 