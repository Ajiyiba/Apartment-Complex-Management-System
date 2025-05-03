// Employee-specific JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    // Update dashboard with real data
    updateDashboard();
    
    // Location selector change event
    const locationSelector = document.getElementById('location');
    if (locationSelector) {
        // Populate the location selector with complex data
        populateLocationSelector();
        
        locationSelector.addEventListener('change', function() {
            const selectedLocation = this.value;
            
            // Filter data based on selected location
            updateBasedOnSelectedLocation(selectedLocation);
        });
    }

    // Setup tabs for dynamic content loading
    setupTabNavigation();

    // Setup employee search functionality
    setupEmployeeSearch();

    // Add event listener for the edit form submission
    const editForm = document.getElementById('editEmployeeForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditEmployeeSubmit);
    }
});

/**
 * Update the dashboard with real data from the database
 */
async function updateDashboard() {
    try {
        // Get dashboard overview stats
        const response = await getDashboardStats();
        
        if (response.success) {
            const stats = response.data;
            
            // Update the overview cards
            updateOverviewCards(stats);
            
            // Update recent activities (this will be mock data for now)
            updateRecentActivities();
        }
    } catch (error) {
        console.error('Error updating dashboard:', error);
        showErrorMessage('Failed to load dashboard data. Please try again later.');
    }
}

/**
 * Update the overview cards with real stats
 */
function updateOverviewCards(stats) {
    const overviewCards = document.querySelectorAll('.overview-card');
    if (overviewCards.length) {
        // Map of card index to stat key
        const cardMap = [
            'Total_Units',
            'Occupied_Units',
            'Vacant_Units',
            'Pending_Requests',
            'Active_Projects'
        ];
        
        overviewCards.forEach((card, index) => {
            if (cardMap[index] && stats[cardMap[index]] !== undefined) {
                const h3 = card.querySelector('h3');
                if (h3) {
                    h3.textContent = stats[cardMap[index]];
                }
            }
        });
    }
}

/**
 * Update recent activities (currently with mock data)
 */
function updateRecentActivities() {
    // In a future version, this would fetch real activity data
    // For now, we'll keep the existing mock data
}

/**
 * Populate the location selector with complex data
 */
async function populateLocationSelector() {
    const locationSelector = document.getElementById('location');
    if (!locationSelector) return;
    
    try {
        const response = await getComplexes();
        
        if (response.success) {
            // Clear existing options except the "All Locations" option
            while (locationSelector.options.length > 1) {
                locationSelector.options.remove(1);
            }
            
            // Add options for each complex
            response.data.forEach(complex => {
                const option = document.createElement('option');
                option.value = complex.Complex_Number;
                option.textContent = `${complex.City} - ${complex.Street}`;
                locationSelector.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error populating location selector:', error);
    }
}

/**
 * Update data based on selected location
 */
function updateBasedOnSelectedLocation(locationId) {
    // Get currently active tab
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return;
    
    // Refresh the data for the active tab with the selected location filter
    if (activeTab.id === 'residents') {
        loadResidentsData(locationId);
    } else if (activeTab.id === 'requests') {
        loadRequestsData(locationId);
    } else if (activeTab.id === 'apartments') {
        loadApartmentsData(locationId);
    } else if (activeTab.id === 'complexes') {
        loadComplexesData();
    } else if (activeTab.id === 'commissions') {
        loadCommissionsData(locationId);
    } else if (activeTab.id === 'employees') {
        // Get search term if present
        const searchInput = document.getElementById('employee-search');
        const searchTerm = searchInput ? searchInput.value.trim() : '';
        loadEmployeesData(locationId, searchTerm);
    } else if (activeTab.id === 'projects') {
        loadProjectsData(locationId);
    } else if (activeTab.id === 'leases') {
        loadLeasesData(locationId);
    }
}

/**
 * Setup tab navigation with dynamic content loading
 */
function setupTabNavigation() {
    const tabLinks = document.querySelectorAll('.tab-link');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Get the target tab
            const targetId = this.getAttribute('data-tab');
            const targetTab = document.getElementById(targetId);
            
            // Hide all tabs and deactivate all links
            const tabs = document.querySelectorAll('.tab-content');
            tabs.forEach(tab => tab.classList.remove('active'));
            
            tabLinks.forEach(link => link.classList.remove('active'));
            
            // Show the target tab and activate the clicked link
            targetTab.classList.add('active');
            this.classList.add('active');
            
            // Load data for the selected tab
            const locationSelector = document.getElementById('location');
            const selectedLocation = locationSelector ? locationSelector.value : 'all';
            
            // Load appropriate data based on the selected tab
            switch (targetId) {
                case 'residents':
                    loadResidentsData(selectedLocation);
                    break;
                case 'requests':
                    loadRequestsData(selectedLocation);
                    break;
                case 'apartments':
                    // Only initialize filters, don't load data
                    initializeApartmentFilters();
                    break;
                case 'complexes':
                    loadComplexesData();
                    break;
                case 'commissions':
                    loadCommissionsData(selectedLocation);
                    break;
                case 'employees':
                    // Get search term if present
                    const searchInput = document.getElementById('employee-search');
                    const searchTerm = searchInput ? searchInput.value.trim() : '';
                    loadEmployeesData(selectedLocation, searchTerm);
                    break;
                case 'projects':
                    loadProjectsData(selectedLocation);
                    break;
                case 'leases':
                    loadLeasesData(selectedLocation);
                    break;
            }
        });
    });
}

/**
 * Formats a SSN into the standard XXX-XX-XXXX format
 * @param {string} ssn - The SSN to format
 * @returns {string} - Formatted SSN (e.g., 123-45-6789)
 */
function formatSSN(ssn) {
    if (!ssn) return '';
    
    // Remove any non-digit characters
    const digits = ssn.replace(/\D/g, '');
    
    // Make sure we have 9 digits
    if (digits.length !== 9) {
        console.warn('Invalid SSN format, expected 9 digits but got:', digits.length);
        return digits; // Return as is if not valid
    }
    
    // Format as XXX-XX-XXXX
    return `${digits.substring(0, 3)}-${digits.substring(3, 5)}-${digits.substring(5, 9)}`;
}

/**
 * Masks an SSN to show only the last 4 digits
 * @param {string} ssn - The SSN to mask
 * @returns {string} - Masked SSN (e.g., XXX-XX-1234)
 */
function maskSSN(ssn) {
    if (!ssn) return '';
    
    // Remove any non-digit characters
    const digits = ssn.replace(/\D/g, '');
    
    // Make sure we have at least 4 digits to work with
    if (digits.length < 4) return 'XXX-XX-XXXX';
    
    // Get the last 4 digits
    const last4 = digits.slice(-4);
    
    // Return the masked format
    return `XXX-XX-${last4}`;
}

/**
 * Load residents data from the API
 */
async function loadResidentsData(locationId) {
    try {
        const response = await getRenters();
        
        if (response.success) {
            let data = response.data;
            
            // Process the data to mask SSNs
            data = data.map(resident => {
                // Mask RSSN
                resident.DisplayRSSN = maskSSN(resident.RSSN);
                return resident;
            });
            
            // Filter by location if specific location selected
            if (locationId && locationId !== 'all') {
                data = data.filter(renter => renter.Complex_Number == locationId);
            }
            
            // Define columns and headers for resident table
            const columns = ['Name', 'DisplayRSSN', 'Credit_Score', 'Complex_Number', 'Room_Number', 'Floor_Plan', 'City'];
            const headers = ['Name', 'SSN', 'Credit Score', 'Complex', 'Room', 'Floor Plan', 'City'];
            
            // Callback for action buttons
            const rowCallback = (td, item) => {
                const detailsBtn = document.createElement('button');
                detailsBtn.className = 'btn btn-primary btn-sm';
                detailsBtn.textContent = 'Details';
                detailsBtn.onclick = () => showResidentDetails(item);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-danger btn-sm';
                deleteBtn.textContent = 'Delete';
                deleteBtn.onclick = () => confirmDelete('resident', item.RSSN, item.Name);
                
                td.appendChild(detailsBtn);
                td.appendChild(document.createTextNode(' '));
                td.appendChild(deleteBtn);
            };
            
            // Populate the table
            populateTable('residents-table', data, columns, headers, rowCallback);
        }
    } catch (error) {
        console.error('Error loading residents data:', error);
        showErrorMessage('Failed to load residents data. Please try again later.');
    }
}

/**
 * Load maintenance requests data from the API
 */
async function loadRequestsData(locationId) {
    try {
        const response = await getMaintenanceRequests();
        
        if (response.success) {
            let data = response.data;
            
            // Filter by location if specific location selected
            if (locationId && locationId !== 'all') {
                data = data.filter(request => request.Complex_Number == locationId);
            }
            
            // Define columns and headers for requests table
            const columns = ['Project_ID', 'Description', 'Complex_Number', 'Issue_Type', 'Reported_By', 'Street'];
            const headers = ['ID', 'Description', 'Complex', 'Type', 'Reported By', 'Location'];
            
            // Callback for action buttons
            const rowCallback = (td, item) => {
                const respondBtn = document.createElement('button');
                respondBtn.className = 'btn btn-primary btn-sm';
                respondBtn.textContent = 'Respond';
                respondBtn.onclick = () => respondToRequest(item);
                
                const completeBtn = document.createElement('button');
                completeBtn.className = 'btn btn-success btn-sm';
                completeBtn.textContent = 'Mark Complete';
                completeBtn.onclick = () => markRequestComplete(item.Project_ID);
                
                td.appendChild(respondBtn);
                td.appendChild(document.createTextNode(' '));
                td.appendChild(completeBtn);
            };
            
            // Populate the table
            populateTable('requests-table', data, columns, headers, rowCallback);
        }
    } catch (error) {
        console.error('Error loading maintenance requests data:', error);
        showErrorMessage('Failed to load maintenance requests data. Please try again later.');
    }
}

/**
 * Initialize apartment filter options without loading apartment data
 */
async function initializeApartmentFilters() {
    try {
        // Get all complexes for the complex filter
        const complexesResponse = await getComplexes();
        if (complexesResponse.success) {
            populateComplexFilterFromComplexes(complexesResponse.data);
        }
        
        // Get a small sample of apartments just to get the floor plans
        const response = await getApartments();
        if (response.success) {
            // Store the data for later use, but don't display yet
            window.apartmentsData = response.data;
            
            // Just populate filter options without applying filters
            populateFloorPlanFilter(response.data);
            
            // Clear any previous count
            const countDisplay = document.getElementById('apartment-count');
            if (countDisplay) {
                countDisplay.textContent = '';
            }
        }
    } catch (error) {
        console.error('Error initializing apartment filters:', error);
        showErrorMessage('Failed to initialize apartment filters. Please try again later.');
    }
}

/**
 * Load complexes data from the API and populate the complexes table
 */
async function loadComplexesData() {
    try {
        // Get the complexes-table element
        const complexesTable = document.getElementById('complexes-table');
        const tableBody = complexesTable.querySelector('tbody');
        tableBody.innerHTML = '<tr><td colspan="6" class="loading-message">Loading complex data...</td></tr>';
        
        console.log('Fetching complex data with force refresh');
        
        // Log the API_BASE_URL for debugging
        console.log('API Base URL:', API_BASE_URL);
        
        // Instead of using getComplexes, try direct fetch to diagnose the issue
        const timestamp = new Date().getTime();
        const url = `${API_BASE_URL}?endpoint=complexes&nocache=${timestamp}`;
        console.log('Making direct fetch to:', url);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                cache: 'no-store',
                headers: { 
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            
            console.log('Direct fetch response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response text:', errorText);
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            // Check content type
            const contentType = response.headers.get('content-type');
            console.log('Response content type:', contentType);
            
            // Get response data
            const data = await response.json();
            console.log('Direct fetch response data:', data);
            
            if (data.success && data.data) {
                const complexes = data.data;
                console.log('Received complexes data:', complexes);
                
                // Define columns and headers for complexes table
                const columns = ['Complex_Number', 'Street', 'City', 'Addr_State', 'Manager_Name'];
                const headers = ['Complex #', 'Street', 'City', 'State', 'Manager'];
                
                // Callback for action buttons
                const rowCallback = (td, item) => {
                    // Create Manage button
                    const manageBtn = document.createElement('button');
                    manageBtn.className = 'btn btn-primary btn-sm';
                    manageBtn.textContent = 'Manage';
                    manageBtn.onclick = () => {
                        window.location.href = `manage-complex.html?complex=${item.Complex_Number}`;
                    };
                    
                    // Create View Details button
                    const detailsBtn = document.createElement('button');
                    detailsBtn.className = 'btn btn-info btn-sm';
                    detailsBtn.textContent = 'Details';
                    detailsBtn.style.marginLeft = '5px';
                    detailsBtn.onclick = () => showComplexDetails(item);
                    
                    // Add buttons to the cell
                    td.appendChild(manageBtn);
                    td.appendChild(detailsBtn);
                };
                
                // Custom formatter for Manager column
                const customFormatters = {
                    Manager_Name: (value, item) => {
                        if (value) {
                            return `${value} (${maskSSN(item.Manager)})`;
                        }
                        return 'No manager assigned';
                    }
                };
                
                // Populate the table with complexes data
                populateTable('complexes-table', complexes, columns, headers, rowCallback, customFormatters);
            } else {
                console.error('Failed to load complexes:', data ? data.error : 'No data');
                tableBody.innerHTML = `<tr><td colspan="6" class="error-message">Failed to load complex data: ${data && data.error ? data.error : 'Unknown error'}</td></tr>`;
            }
        } catch (fetchError) {
            console.error('Direct fetch error:', fetchError);
            throw fetchError;
        }
    } catch (error) {
        console.error('Error loading complexes data:', error);
        const tableBody = document.getElementById('complexes-table').querySelector('tbody');
        tableBody.innerHTML = `<tr><td colspan="6" class="error-message">Error: ${error.message}</td></tr>`;
        
        // Try to check if the server is reachable
        try {
            const pingResponse = await fetch(`${API_BASE_URL}?ping=1`);
            console.log('Server ping response:', pingResponse.status);
            if (pingResponse.ok) {
                console.log('Server is reachable, but endpoint may be incorrect');
            }
        } catch (pingError) {
            console.error('Server appears to be unreachable:', pingError);
        }
    }
}

/**
 * Show complex details in a modal
 * @param {Object} complex - Complex data object
 */
function showComplexDetails(complex) {
    alert(`Complex Details:\nComplex #: ${complex.Complex_Number}\nStreet: ${complex.Street}\nCity: ${complex.City}\nState: ${complex.Addr_State}\nManager: ${complex.Manager_Name} (${maskSSN(complex.Manager)})`);
}

/**
 * Populate complex filter from complexes data
 */
function populateComplexFilterFromComplexes(data) {
    const complexFilter = document.getElementById('apartment-complex-filter');
    if (!complexFilter) return;
    
    // Clear existing options except the first one (All Complexes)
    while (complexFilter.options.length > 1) {
        complexFilter.options.remove(1);
    }
    
    // Add options for each complex
    data.forEach(complex => {
        const option = document.createElement('option');
        option.value = complex.Complex_Number;
        option.textContent = `${complex.City} - ${complex.Complex_Number}`;
        complexFilter.appendChild(option);
    });
}

/**
 * Load apartments data from the API and display results
 */
async function loadApartmentsData() {
    try {
        // If we already have the data from initialization, use that
        if (window.apartmentsData && window.apartmentsData.length > 0) {
            // Apply filters to existing data
            applyApartmentFilters();
            return;
        }
        
        // Otherwise fetch the data
        const response = await getApartments();
        
        if (response.success) {
            // Store the original unfiltered data for later filtering
            window.apartmentsData = response.data;
            
            // Apply filters
            applyApartmentFilters();
        } else {
            console.error("Failed to load apartments data:", response.error);
        }
    } catch (error) {
        console.error('Error loading apartments data:', error);
        showErrorMessage('Failed to load apartments data. Please try again later.');
    }
}

/**
 * Populate floor plan filter select with unique floor plans
 */
function populateFloorPlanFilter(data) {
    const floorPlanFilter = document.getElementById('apartment-floorplan-filter');
    if (!floorPlanFilter) return;
    
    // Get unique floor plans
    const floorPlans = [...new Set(data.map(item => item.Floor_Plan))].sort();
    
    // Clear existing options except the first one (All Floor Plans)
    while (floorPlanFilter.options.length > 1) {
        floorPlanFilter.options.remove(1);
    }
    
    // Add options for each floor plan
    floorPlans.forEach(floorPlan => {
        const option = document.createElement('option');
        option.value = floorPlan;
        option.textContent = floorPlan;
        floorPlanFilter.appendChild(option);
    });
}

/**
 * Apply all filters to apartments data
 */
function applyApartmentFilters() {
    // Get filter values
    const complexFilter = document.getElementById('apartment-complex-filter');
    const unitFilter = document.getElementById('apartment-unit-filter');
    const statusFilter = document.getElementById('apartment-status-filter');
    const floorPlanFilter = document.getElementById('apartment-floorplan-filter');
    
    const complexValue = complexFilter ? complexFilter.value : 'all';
    const unitValue = unitFilter ? unitFilter.value.trim() : '';
    const statusValue = statusFilter ? statusFilter.value : 'all';
    const floorPlanValue = floorPlanFilter ? floorPlanFilter.value : 'all';
    
    // Get original data
    let filteredData = window.apartmentsData || [];
    
    // Apply complex filter
    if (complexValue && complexValue !== 'all') {
        filteredData = filteredData.filter(apartment => apartment.Complex_Number == complexValue);
    }
    
    // Apply unit filter
    if (unitValue) {
        filteredData = filteredData.filter(apartment => apartment.Room_Number.toString().includes(unitValue));
    }
    
    // Apply status filter
    if (statusValue && statusValue !== 'all') {
        filteredData = filteredData.filter(apartment => apartment.Status === statusValue);
    }
    
    // Apply floor plan filter
    if (floorPlanValue && floorPlanValue !== 'all') {
        filteredData = filteredData.filter(apartment => apartment.Floor_Plan === floorPlanValue);
    }
    
    // If Status is missing, add it
    if (filteredData.length > 0 && !filteredData[0].Status) {
        filteredData = filteredData.map(apt => {
            apt.Status = apt.Renter_Name ? 'Occupied' : 'Vacant';
            return apt;
        });
    }
    
    // Define columns and headers for apartments table
    const columns = ['Complex_Number', 'Room_Number', 'Floor_Plan', 'Street', 'City', 'Addr_State', 'Status', 'Renter_Name'];
    const headers = ['Complex', 'Room', 'Floor Plan', 'Street', 'City', 'State', 'Status', 'Renter'];
    
    // Callback for action buttons and status styling
    const rowCallback = (td, item) => {
        const detailsBtn = document.createElement('button');
        detailsBtn.className = 'btn btn-primary btn-sm';
        detailsBtn.textContent = 'Details';
        detailsBtn.onclick = () => showApartmentDetails(item);
        
        // Add a "Manage Complex" button
        const manageComplexBtn = document.createElement('button');
        manageComplexBtn.className = 'btn btn-info btn-sm';
        manageComplexBtn.textContent = 'Manage Complex';
        manageComplexBtn.style.marginLeft = '5px';
        manageComplexBtn.onclick = () => {
            window.location.href = `manage-complex.html?complex=${item.Complex_Number}`;
        };
        
        td.appendChild(detailsBtn);
        td.appendChild(manageComplexBtn);
    };
    
    // Custom formatter for Status column
    const customFormatters = {
        Status: (value, item) => {
            const statusDiv = document.createElement('div');
            statusDiv.className = `status-indicator status-${value ? value.toLowerCase() : 'vacant'}`;
            statusDiv.textContent = value || 'Vacant';
            return statusDiv;
        }
    };
    
    // Populate the table with filtered data
    populateTable('apartments-table', filteredData, columns, headers, rowCallback, customFormatters);
    
    // Update the count display
    const countDisplay = document.getElementById('apartment-count');
    if (countDisplay) {
        countDisplay.textContent = `${filteredData.length} apartments found`;
    }
}

/**
 * Load commissions data
 * This would be implemented in a similar way to the other data loading functions
 */
function loadCommissionsData(locationId) {
    // For now, we'll show a message that this is not implemented yet
    const commissionsTable = document.getElementById('commissions-table');
    if (commissionsTable) {
        commissionsTable.innerHTML = '<tr><td colspan="5">Commissions data will be loaded here in a future update.</td></tr>';
    }
}

/**
 * Load employees data from the API
 */
async function loadEmployeesData(locationId, searchTerm = '') {
    try {
        console.log('Loading employees data...');
        
        // Clear the table first and show loading message
        const tableBody = document.querySelector('#employees-table tbody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5" class="loading-message">Loading employee data...</td></tr>';
        }
        
        // Generate timestamp for cache busting
        const timestamp = new Date().getTime();
        
        // Try to get fresh data from the server
        const response = await fetch(`../server/api.php?endpoint=employees&nocache=${timestamp}`, {
            method: 'GET',
            cache: 'no-store',
            headers: { 
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error! Status: ${response.status}, Response:`, errorText);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Check the content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Response is not JSON:', text);
            throw new Error('Response is not JSON. Check server logs.');
        }
        
        const data = await response.json();
        console.log('Employees response:', data);
        
        if (data.success) {
            let employees = data.data;
            
            // Process the data to ensure assigned complexes are properly formatted
            employees = employees.map(employee => {
                // Format salary as currency
                employee.FormattedSalary = new Intl.NumberFormat('en-US', { 
                    style: 'currency', 
                    currency: 'USD' 
                }).format(employee.Salary);
                
                // Mask the ESSN
                employee.DisplayESSN = maskSSN(employee.ESSN);
                
                // Ensure Assigned_Complexes is a string (or empty string)
                if (!employee.Assigned_Complexes) {
                    employee.Assigned_Complexes = 'None';
                }
                
                // If we have complex objects, we can create a more detailed display
                if (employee.WorksAtComplexes && employee.WorksAtComplexes.length > 0) {
                    employee.ComplexesDetail = employee.WorksAtComplexes.map(complex => 
                        `#${complex.Complex_Number} (${complex.City})`
                    ).join(', ');
                } else {
                    employee.ComplexesDetail = 'None';
                }
                
                return employee;
            });
            
            // Filter by location if specific location selected
            if (locationId && locationId !== 'all') {
                employees = employees.filter(employee => {
                    if (!employee.Assigned_Complexes || employee.Assigned_Complexes === 'None') return false;
                    const assignedComplexes = employee.Assigned_Complexes.split(', ');
                    return assignedComplexes.includes(locationId.toString());
                });
            }
            
            // Filter by search term if provided
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                employees = employees.filter(employee => 
                    (employee.Name && employee.Name.toLowerCase().includes(searchLower)) || 
                    (employee.ESSN && employee.ESSN.toLowerCase().includes(searchLower))
                );
            }
            
            // Update the employee count display
            const employeeCountElement = document.getElementById('employee-count');
            if (employeeCountElement) {
                employeeCountElement.textContent = `Found ${employees.length} employee${employees.length !== 1 ? 's' : ''}`;
            }
            
            // Define columns and headers for employees table
            const columns = ['Name', 'DisplayESSN', 'FormattedSalary', 'ComplexesDetail'];
            const headers = ['Name', 'SSN', 'Salary', 'Assigned Complexes'];
            
            // Callback for action buttons
            const rowCallback = (td, item) => {
                const editBtn = document.createElement('button');
                editBtn.className = 'btn btn-primary btn-sm';
                editBtn.textContent = 'Edit';
                editBtn.onclick = () => {
                    // Use clean SSN format for the URL to ensure consistent handling
                    const cleanEssn = item.ESSN.replace(/\D/g, '');
                    window.location.href = `add-employee.html?essn=${cleanEssn}`;
                };
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-danger btn-sm';
                deleteBtn.textContent = 'Delete';
                deleteBtn.onclick = () => confirmDelete('employee', item.ESSN, item.Name);
                
                td.appendChild(editBtn);
                td.appendChild(document.createTextNode(' '));
                td.appendChild(deleteBtn);
            };
            
            // Populate the table
            populateTable('employees-table', employees, columns, headers, rowCallback);
        } else {
            console.error('Failed to load employees:', data.error);
            
            // Display error in table
            const tableBody = document.querySelector('#employees-table tbody');
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="5" class="error-message">Error: ${data.error || 'Unknown error'}</td></tr>`;
            }
            
            showErrorMessage('Failed to load employees data: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading employees data:', error);
        
        // Display error in table
        const tableBody = document.querySelector('#employees-table tbody');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="5" class="error-message">Error: ${error.message}</td></tr>`;
        }
        
        showErrorMessage('Failed to load employees data: ' + error.message);
    }
}

/**
 * Load projects data from the API
 */
async function loadProjectsData(locationId) {
    try {
        const response = await getProjects();
        
        if (response.success) {
            let data = response.data;
            
            // Filter by location if specific location selected
            if (locationId && locationId !== 'all') {
                data = data.filter(project => project.Complex_Number == locationId);
            }
            
            // Define columns and headers for projects table
            const columns = ['Project_ID', 'Type', 'Complex_Number', 'Budget', 'Street', 'City'];
            const headers = ['ID', 'Type', 'Complex', 'Budget', 'Street', 'City'];
            
            // Callback for action buttons
            const rowCallback = (td, item) => {
                const detailsBtn = document.createElement('button');
                detailsBtn.className = 'btn btn-primary btn-sm';
                detailsBtn.textContent = 'Details';
                detailsBtn.onclick = () => showProjectDetails(item);
                
                td.appendChild(detailsBtn);
            };
            
            // Populate the table
            populateTable('projects-table', data, columns, headers, rowCallback);
        }
    } catch (error) {
        console.error('Error loading projects data:', error);
        showErrorMessage('Failed to load projects data. Please try again later.');
    }
}

/**
 * Load leases data from the API
 */
async function loadLeasesData(locationId) {
    try {
        const response = await getLeases();
        
        if (response.success) {
            let data = response.data;
            
            // Process data to mask SSNs
            data = data.map(lease => {
                // Mask RSSN if present
                if (lease.RSSN) {
                    lease.DisplayRSSN = maskSSN(lease.RSSN);
                }
                return lease;
            });
            
            // Filter by location if specific location selected
            if (locationId && locationId !== 'all') {
                data = data.filter(lease => lease.Complex_Number == locationId);
            }
            
            // Define columns and headers for leases table
            const columns = ['Contract_ID', 'Renter_Name', 'Type', 'Payment_Amount', 'Complex_Number', 'Room_Number'];
            const headers = ['Contract ID', 'Renter', 'Type', 'Payment Amount', 'Complex', 'Room'];
            
            // Callback for action buttons
            const rowCallback = (td, item) => {
                const detailsBtn = document.createElement('button');
                detailsBtn.className = 'btn btn-primary btn-sm';
                detailsBtn.textContent = 'Details';
                detailsBtn.onclick = () => showLeaseDetails(item);
                
                const renewBtn = document.createElement('button');
                renewBtn.className = 'btn btn-success btn-sm';
                renewBtn.textContent = 'Renew';
                renewBtn.onclick = () => renewLease(item.Contract_ID);
                
                td.appendChild(detailsBtn);
                td.appendChild(document.createTextNode(' '));
                td.appendChild(renewBtn);
            };
            
            // Populate the table
            populateTable('leases-table', data, columns, headers, rowCallback);
        }
    } catch (error) {
        console.error('Error loading leases data:', error);
        showErrorMessage('Failed to load leases data. Please try again later.');
    }
}

// Helper functions for UI actions

function showResidentDetails(resident) {
    // Use the masked SSN for display
    const displaySSN = maskSSN(resident.RSSN);
    alert(`Details for resident: ${resident.Name}\nSSN: ${displaySSN}\nApartment: ${resident.Complex_Number}-${resident.Room_Number}`);
}

function showApartmentDetails(apartment) {
    alert(`Details for apartment: ${apartment.Complex_Number}-${apartment.Room_Number}\nFloor Plan: ${apartment.Floor_Plan}\nLocation: ${apartment.Street}, ${apartment.City}, ${apartment.Addr_State}`);
}

function showProjectDetails(project) {
    alert(`Details for project: ${project.Project_ID}\nType: ${project.Type}\nComplex: ${project.Complex_Number}\nBudget: $${project.Budget || 'N/A'}`);
}

// Function to show the employee edit modal
async function showEditEmployeeModal(employee) {
    const modal = document.getElementById('employeeEditModal');
    const form = document.getElementById('editEmployeeForm');
    
    // Populate form fields
    document.getElementById('editEssn').value = maskSSN(employee.ESSN);
    // Store the raw ESSN in a hidden field or data attribute for submission
    document.getElementById('editEssn').dataset.rawEssn = employee.ESSN;
    document.getElementById('editName').value = employee.Name;
    document.getElementById('editSalary').value = employee.Salary;
    
    // Populate complexes select
    const complexesSelect = document.getElementById('editComplexes');
    complexesSelect.innerHTML = ''; // Clear existing options
    
    try {
        const response = await getComplexes();
        if (response.success) {
            response.data.forEach(complex => {
                const option = document.createElement('option');
                option.value = complex.Complex_Number;
                option.textContent = `${complex.City} - ${complex.Street}`;
                
                // Select if employee is assigned to this complex
                if (employee.Assigned_Complexes && 
                    employee.Assigned_Complexes.split(', ').includes(complex.Complex_Number.toString())) {
                    option.selected = true;
                }
                
                complexesSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading complexes:', error);
        showErrorMessage('Failed to load complexes data.');
    }
    
    // Show modal
    modal.style.display = 'block';
    
    // Close modal when clicking the X button
    document.querySelector('.close-modal').onclick = () => {
        modal.style.display = 'none';
    };
    
    // Close modal when clicking outside
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Function to handle employee edit form submission
async function handleEditEmployeeSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = {
        // Get the raw ESSN from the data attribute instead of the masked value
        essn: document.getElementById('editEssn').dataset.rawEssn,
        name: form.name.value,
        salary: form.salary.value,
        complexes: Array.from(form.complexes.selectedOptions).map(option => option.value)
    };
    
    try {
        const response = await updateEmployee(formData);
        if (response.success) {
            // Close modal
            document.getElementById('employeeEditModal').style.display = 'none';
            
            // Show success message
            showSuccessMessage('Employee updated successfully!');
            
            // Refresh employee data
            const locationSelector = document.getElementById('location');
            loadEmployeesData(locationSelector ? locationSelector.value : null);
        } else {
            showErrorMessage(response.error || 'Failed to update employee.');
        }
    } catch (error) {
        console.error('Error updating employee:', error);
        showErrorMessage('Failed to update employee. Please try again.');
    }
}

// Function to show success message
function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Update the editEmployee function to use the modal
function editEmployee(employee) {
    showEditEmployeeModal(employee);
}

function showErrorMessage(message) {
    // Create a notification element
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function showLeaseDetails(lease) {
    // Use masked SSN if available
    const displaySSN = lease.DisplayRSSN || 'Not provided';
    alert(`Details for lease: ${lease.Contract_ID}\nRenter: ${lease.Renter_Name}\nRenter SSN: ${displaySSN}\nType: ${lease.Type}\nPayment Amount: $${lease.Payment_Amount}`);
}

function renewLease(contractId) {
    if (confirm(`Do you want to renew lease contract ${contractId}?`)) {
        alert(`Lease contract ${contractId} renewal process started.`);
    }
}

// Setup event listeners for apartment filters
document.addEventListener('DOMContentLoaded', function() {
    const setupApartmentFilters = () => {
        const statusFilter = document.getElementById('apartment-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', applyApartmentFilters);
        }
        
        const resetButton = document.getElementById('reset-apartment-filters');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                const statusFilter = document.getElementById('apartment-status-filter');
                const floorPlanFilter = document.getElementById('apartment-floorplan-filter');
                
                if (statusFilter) statusFilter.value = 'all';
                if (floorPlanFilter) floorPlanFilter.value = 'all';
                
                applyApartmentFilters();
            });
        }
    };
    
    // Either run setup immediately if DOM is already fully loaded or add to existing event listeners
    if (document.readyState === 'complete') {
        setupApartmentFilters();
    } else {
        const originalDOMContentLoaded = window.onDOMContentLoaded;
        window.onDOMContentLoaded = function(event) {
            if (originalDOMContentLoaded) originalDOMContentLoaded(event);
            setupApartmentFilters();
        };
    }
});

/**
 * Confirm deletion of an item
 * @param {string} type - The type of item to delete (e.g., 'employee', 'resident')
 * @param {string} id - The ID of the item to delete
 * @param {string} name - The name of the item for display in the confirmation dialog
 */
function confirmDelete(type, id, name) {
    // Create a confirmation dialog
    const confirmationDialog = document.createElement('div');
    confirmationDialog.className = 'modal confirmation-dialog';
    confirmationDialog.style.display = 'block';
    confirmationDialog.style.position = 'fixed';
    confirmationDialog.style.zIndex = '1000';
    confirmationDialog.style.left = '0';
    confirmationDialog.style.top = '0';
    confirmationDialog.style.width = '100%';
    confirmationDialog.style.height = '100%';
    confirmationDialog.style.overflow = 'auto';
    confirmationDialog.style.backgroundColor = 'rgba(0,0,0,0.4)';
    
    // Create dialog content
    const dialogContent = document.createElement('div');
    dialogContent.className = 'modal-content';
    dialogContent.style.backgroundColor = '#fefefe';
    dialogContent.style.margin = '15% auto';
    dialogContent.style.padding = '20px';
    dialogContent.style.border = '1px solid #888';
    dialogContent.style.width = '50%';
    dialogContent.style.maxWidth = '500px';
    dialogContent.style.borderRadius = '5px';
    dialogContent.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    
    // Create dialog header
    const dialogHeader = document.createElement('div');
    dialogHeader.style.marginBottom = '15px';
    dialogHeader.style.display = 'flex';
    dialogHeader.style.justifyContent = 'space-between';
    dialogHeader.style.alignItems = 'center';
    
    const dialogTitle = document.createElement('h3');
    dialogTitle.textContent = 'Confirm Deletion';
    dialogTitle.style.margin = '0';
    dialogTitle.style.color = '#d9534f';
    
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.color = '#aaa';
    closeBtn.style.float = 'right';
    closeBtn.style.fontSize = '28px';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => document.body.removeChild(confirmationDialog);
    
    dialogHeader.appendChild(dialogTitle);
    dialogHeader.appendChild(closeBtn);
    
    // Create dialog body
    const dialogBody = document.createElement('div');
    dialogBody.style.marginBottom = '20px';
    
    const warningIcon = document.createElement('div');
    warningIcon.innerHTML = '⚠️';
    warningIcon.style.fontSize = '48px';
    warningIcon.style.textAlign = 'center';
    warningIcon.style.marginBottom = '10px';
    
    const message = document.createElement('p');
    message.innerHTML = `Are you sure you want to delete the ${type} <strong>${name}</strong>?<br>This action cannot be undone.`;
    message.style.textAlign = 'center';
    
    dialogBody.appendChild(warningIcon);
    dialogBody.appendChild(message);
    
    // Create dialog footer with buttons
    const dialogFooter = document.createElement('div');
    dialogFooter.style.display = 'flex';
    dialogFooter.style.justifyContent = 'center';
    dialogFooter.style.gap = '10px';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.style.padding = '8px 16px';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.style.backgroundColor = '#6c757d';
    cancelBtn.style.color = 'white';
    cancelBtn.onclick = () => document.body.removeChild(confirmationDialog);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.style.padding = '8px 16px';
    deleteBtn.style.border = 'none';
    deleteBtn.style.borderRadius = '4px';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.backgroundColor = '#d9534f';
    deleteBtn.style.color = 'white';
    deleteBtn.onclick = () => {
        // Remove the dialog
        document.body.removeChild(confirmationDialog);
        
        // Perform deletion based on type
        if (type === 'employee') {
            // Log the ESSN being passed for debugging
            console.log('ESSN passed to deletion function:', id);
            
            // For employees, make sure we have a properly formatted ESSN
            // The backend expects a 9-digit number, so we need to handle any formatting
            const cleanEssn = id.replace(/\D/g, ''); // Remove any non-digit characters (like dashes)
            if (cleanEssn.length !== 9) {
                console.error(`Invalid ESSN format: ${id}, cleaned to ${cleanEssn} (not 9 digits)`);
                showErrorMessage('Cannot delete employee: Invalid ESSN format');
                return;
            }
            
            performEmployeeDeletion(cleanEssn);
        } else if (type === 'resident') {
            // Handle resident deletion (to be implemented)
            console.log('Deleting resident:', id);
        } else {
            console.error('Unknown item type for deletion:', type);
        }
    };
    
    dialogFooter.appendChild(cancelBtn);
    dialogFooter.appendChild(deleteBtn);
    
    // Assemble the dialog
    dialogContent.appendChild(dialogHeader);
    dialogContent.appendChild(dialogBody);
    dialogContent.appendChild(dialogFooter);
    confirmationDialog.appendChild(dialogContent);
    
    // Add the dialog to the document
    document.body.appendChild(confirmationDialog);
    
    // Close when clicking outside the dialog
    window.onclick = (event) => {
        if (event.target === confirmationDialog) {
            document.body.removeChild(confirmationDialog);
        }
    };
}

/**
 * Delete an employee
 * @param {string} essn - The employee's SSN
 */
async function performEmployeeDeletion(essn) {
    try {
        console.log('Initiating employee deletion with ESSN:', essn);
        
        // Validate ESSN format
        if (!essn) {
            console.error('Cannot delete employee: Missing ESSN');
            showErrorMessage('Cannot delete employee: Missing information');
            return;
        }
        
        // Make sure we have a clean 9-digit ESSN
        const cleanEssn = essn.replace(/\D/g, '');
        if (cleanEssn.length !== 9) {
            console.error(`Invalid ESSN format: ${essn}, cleaned to ${cleanEssn} (not 9 digits)`);
            showErrorMessage('Cannot delete employee: Invalid ESSN format');
            return;
        }
        
        // Show loading message
        showSuccessMessage('Deleting employee...');
        
        // Call the API function to delete the employee
        const response = await deleteEmployee(cleanEssn);
        console.log('Delete API response:', response);
        
        if (response.success) {
            // Show success message
            showSuccessMessage('Employee deleted successfully!');
            
            // Refresh employee data
            const locationSelector = document.getElementById('location');
            loadEmployeesData(locationSelector ? locationSelector.value : null);
        } else {
            // Show error message with details
            const errorMsg = response.error || 'Failed to delete employee.';
            console.error('Error deleting employee:', errorMsg);
            
            // Show more user-friendly error messages for common cases
            if (errorMsg.includes('managing') && errorMsg.includes('complexes')) {
                showErrorMessage('Cannot delete this employee because they are a manager for one or more complexes. Please reassign these complexes to another manager first.');
            } else if (errorMsg.includes('not found')) {
                showErrorMessage('Employee not found. It may have been already deleted or the ID is incorrect.');
            } else {
                showErrorMessage(errorMsg);
            }
        }
    } catch (error) {
        console.error('Error in performEmployeeDeletion:', error);
        showErrorMessage(`Failed to delete employee: ${error.message}`);
    }
}

// Function to handle employee search
function setupEmployeeSearch() {
    const searchInput = document.getElementById('employee-search');
    const searchButton = document.getElementById('search-employees-button');
    const resetButton = document.getElementById('reset-employee-filters');
    const locationSelector = document.getElementById('location');
    
    if (searchInput && searchButton && resetButton) {
        // Enable search on button click
        searchButton.addEventListener('click', () => {
            const searchTerm = searchInput.value.trim();
            const locationId = locationSelector ? locationSelector.value : 'all';
            loadEmployeesData(locationId, searchTerm);
        });
        
        // Enable search on Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchInput.value.trim();
                const locationId = locationSelector ? locationSelector.value : 'all';
                loadEmployeesData(locationId, searchTerm);
            }
        });
        
        // Reset filters
        resetButton.addEventListener('click', () => {
            searchInput.value = '';
            const locationId = locationSelector ? locationSelector.value : 'all';
            loadEmployeesData(locationId);
        });
    }
} 