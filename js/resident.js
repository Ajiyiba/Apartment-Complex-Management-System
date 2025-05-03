// Resident-specific JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    // Handle the tabs in the Renew/Cancel Lease section
    const navTabLinks = document.querySelectorAll('.action-tabs .nav-tabs a');
    
    navTabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the tab target
            const tabId = this.getAttribute('href').substring(1);
            const targetTab = document.getElementById(tabId);
            
            // Hide all tab panes and deactivate all nav links
            const allTabPanes = document.querySelectorAll('.action-tabs .tab-pane');
            allTabPanes.forEach(pane => pane.classList.remove('active'));
            
            navTabLinks.forEach(link => {
                link.parentElement.classList.remove('active');
            });
            
            // Show the target tab pane and activate the clicked link
            targetTab.classList.add('active');
            this.parentElement.classList.add('active');
        });
    });

    // Payment form submission
    const payNowButton = document.querySelector('.btn-pay-now');
    if (payNowButton) {
        payNowButton.addEventListener('click', function() {
            // In a real application, this would open a payment modal or navigate to a payment form
            alert('This would open the payment form in a real application.');
        });
    }

    // File upload preview (for maintenance request photos)
    const fileInput = document.getElementById('request-photo');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const previewContainer = document.createElement('div');
                previewContainer.classList.add('photo-preview');
                
                // Remove any existing previews
                const existingPreview = document.querySelector('.photo-preview');
                if (existingPreview) {
                    existingPreview.remove();
                }
                
                // Create preview image
                const img = document.createElement('img');
                img.src = URL.createObjectURL(this.files[0]);
                img.style.maxWidth = '100%';
                img.style.maxHeight = '200px';
                img.onload = function() {
                    URL.revokeObjectURL(this.src);
                };
                
                previewContainer.appendChild(img);
                this.parentNode.appendChild(previewContainer);
            }
        });
    }

    // Form validation for the maintenance request form
    const maintenanceForm = document.querySelector('#maintenance-tab form');
    if (maintenanceForm) {
        maintenanceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const category = document.getElementById('request-category').value;
            const priority = document.getElementById('request-priority').value;
            const description = document.getElementById('request-description').value;
            const access = document.getElementById('request-access').value;
            
            if (!category || !priority || !description || !access) {
                alert('Please fill out all required fields.');
                return;
            }
            
            // In a real application, this would submit the form via AJAX
            alert('Your maintenance request has been submitted successfully!');
            this.reset();
            
            // Remove photo preview if exists
            const photoPreview = document.querySelector('.photo-preview');
            if (photoPreview) {
                photoPreview.remove();
            }
        });
    }

    // Form validation for the renewal and cancellation forms
    const renewalForm = document.querySelector('#renew-form form');
    if (renewalForm) {
        renewalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const term = document.getElementById('renewal-term').value;
            const date = document.getElementById('renewal-date').value;
            
            if (!term || !date) {
                alert('Please fill out all required fields.');
                return;
            }
            
            // In a real application, this would submit the form via AJAX
            alert('Your lease renewal request has been submitted successfully!');
            this.reset();
        });
    }

    const cancellationForm = document.querySelector('#cancel-form form');
    if (cancellationForm) {
        cancellationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const date = document.getElementById('cancel-date').value;
            const reason = document.getElementById('cancel-reason').value;
            
            if (!date || !reason) {
                alert('Please fill out all required fields.');
                return;
            }
            
            // In a real application, this would submit the form via AJAX
            alert('Your lease cancellation request has been submitted successfully!');
            this.reset();
        });
    }
}); 