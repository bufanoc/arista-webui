// Main initialization script for Arista Switch Manager

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded, initializing application...');
    
    // Load initial data for the dashboard
    loadSwitchInfo();
    
    // Set up tab switching
    const tabElements = document.querySelectorAll('#switchTabs button');
    
    tabElements.forEach(tab => {
        tab.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Remove active class from all tabs and tab panes
            tabElements.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            
            // Show corresponding tab pane
            const target = document.querySelector(this.getAttribute('data-bs-target'));
            target.classList.add('show', 'active');
            
            // Load data based on selected tab
            const tabId = this.id;
            console.log('Tab selected:', tabId);
            
            if (tabId === 'dashboard-tab') {
                loadSwitchInfo();
            } else if (tabId === 'ports-tab') {
                loadInterfaces();
            } else if (tabId === 'vlans-tab') {
                loadVlans();
            }
        });
    });
});
