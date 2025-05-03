// Toggle mobile menu
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('active');
        });
    }

    // Form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            let valid = true;
            
            // Check required fields
            const requiredFields = form.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    valid = false;
                    field.classList.add('error');
                } else {
                    field.classList.remove('error');
                }
            });
            
            // Check password confirmation
            const password = form.querySelector('#password');
            const confirmPassword = form.querySelector('#confirm-password');
            if (password && confirmPassword) {
                if (password.value !== confirmPassword.value) {
                    valid = false;
                    confirmPassword.classList.add('error');
                    alert('Passwords do not match!');
                } else {
                    confirmPassword.classList.remove('error');
                }
            }
            
            if (!valid) {
                event.preventDefault();
                alert('Please check the form and try again.');
            }
        });
    });

    // Clear validation errors on input
    document.addEventListener('input', function(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') {
            event.target.classList.remove('error');
            const errorMsg = event.target.nextElementSibling;
            if (errorMsg && errorMsg.classList.contains('error-message')) {
                errorMsg.remove();
            }
        }
    });

    // Tab navigation
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
        });
    });

    // Initialize the filter and search functionality
    initializeSearch();
});

// Validate email format
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Initialize search and filter functionality
function initializeSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(input => {
        input.addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase();
            const tableId = this.getAttribute('data-table');
            const table = document.getElementById(tableId);
            
            if (table) {
                const rows = table.querySelectorAll('tbody tr');
                
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            }
        });
    });

    // Handle filters
    const filterSelects = document.querySelectorAll('.filter-select');
    
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            const filterValue = this.value;
            const filterType = this.getAttribute('data-filter');
            const tableId = this.getAttribute('data-table');
            const table = document.getElementById(tableId);
            
            if (table && filterType) {
                const rows = table.querySelectorAll('tbody tr');
                
                rows.forEach(row => {
                    if (filterValue === 'all') {
                        row.style.display = '';
                    } else {
                        const cell = row.querySelector(`[data-filter="${filterType}"]`);
                        if (cell && cell.textContent === filterValue) {
                            row.style.display = '';
                        } else {
                            row.style.display = 'none';
                        }
                    }
                });
            }
        });
    });
}

// Show/hide password toggle
function togglePasswordVisibility(inputId) {
    const passwordInput = document.getElementById(inputId);
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
    } else {
        passwordInput.type = "password";
    }
}

// Auto-generate IDs for forms that need it
document.addEventListener('DOMContentLoaded', function() {
    // Form field auto-generation functions can be added here
    // For example, date-related fields for contracts, invoices, etc.
});

/**
 * Normalize property names to ensure consistent PascalCase with underscores
 * Use this as a safety measure when working with API responses
 * @param {Object|Array} data - The data to normalize
 * @returns {Object|Array} - Data with normalized property names
 */
function normalizePropertyNames(data) {
    // If data is an array, process each item
    if (Array.isArray(data)) {
        return data.map(item => normalizePropertyNames(item));
    }
    
    // If data is an object, normalize property names
    if (data && typeof data === 'object' && !(data instanceof Date)) {
        const normalized = {};
        
        Object.keys(data).forEach(key => {
            // Convert from possible lowercase to PascalCase with underscores
            const parts = key.split('_');
            const pascalKey = parts.map(part => 
                part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            ).join('_');
            
            // Handle nested objects/arrays
            normalized[pascalKey] = normalizePropertyNames(data[key]);
        });
        
        return normalized;
    }
    
    // Return primitive values as is
    return data;
}

// Example usage:
// async function loadData() {
//   try {
//     const response = await fetch('/api/endpoint');
//     const jsonData = await response.json();
//     
//     if (jsonData.success) {
//       // Normalize all property names in the data
//       const normalizedData = normalizePropertyNames(jsonData.data);
//       // Use normalizedData with consistent property naming
//     }
//   } catch (error) {
//     console.error('Error loading data:', error);
//   }
// } 