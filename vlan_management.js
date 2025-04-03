// Function to load VLANs from the API
function loadVlans() {
    const vlansInfoEl = document.getElementById('vlansInfo');
    
    // Show loading indicator
    vlansInfoEl.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading VLANs...</p>
        </div>
    `;
    
    // Fetch VLANs from API
    fetch(apiUrl + '/vlans')
        .then(response => {
            console.log('VLANs response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('VLANs data:', data);
            
            // Display a simple message for now
            vlansInfoEl.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    VLAN Management functionality will be implemented in the next phase.
                </div>
                <button id="createVlanBtn" class="btn btn-primary">
                    <i class="bi bi-plus-circle me-2"></i>Create VLAN
                </button>
            `;
            
            // Add event listener to create VLAN button
            document.getElementById('createVlanBtn').addEventListener('click', function() {
                alert('Create VLAN functionality will be implemented in the next phase');
            });
        })
        .catch(error => {
            console.error('Error loading VLANs:', error);
            vlansInfoEl.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Error loading VLANs: ${error.message}
                </div>
            `;
        });
}

// Initialize the VLAN management tab when it's shown
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to tab
    document.querySelector('button[data-bs-target="#vlanManagement"]').addEventListener('click', function() {
        loadVlans();
    });
});
