// Function to load switch information
function loadSwitchInfo() {
    const switchInfoEl = document.getElementById('switchInfo');
    
    // Show loading indicator
    switchInfoEl.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading switch information...</p>
        </div>
    `;
    
    // Fetch switch information from API
    fetch(apiUrl + '/')
        .then(response => {
            console.log('Switch info response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Switch info data:', data);
            
            if (!data || data.length === 0) {
                switchInfoEl.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        No switch information available
                    </div>
                `;
                return;
            }
            
            // Extract switch information
            const switchInfo = data[0];
            
            // Format memory usage
            const memTotal = switchInfo.memTotal ? (switchInfo.memTotal / 1024).toFixed(2) : 'N/A';
            const memFree = switchInfo.memFree ? (switchInfo.memFree / 1024).toFixed(2) : 'N/A';
            const memUsed = switchInfo.memTotal && switchInfo.memFree 
                ? ((switchInfo.memTotal - switchInfo.memFree) / 1024).toFixed(2) 
                : 'N/A';
            const memUsagePercent = switchInfo.memTotal && switchInfo.memFree 
                ? ((switchInfo.memTotal - switchInfo.memFree) / switchInfo.memTotal * 100).toFixed(1) 
                : 'N/A';
            
            // Format uptime
            const uptime = formatUptime(switchInfo.uptime);
            
            // Create HTML for switch information
            let html = `
                <div class="row">
                    <div class="col-md-6">
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Switch Details</h5>
                            </div>
                            <div class="card-body">
                                <table class="table table-sm">
                                    <tbody>
                                        <tr>
                                            <th scope="row">Model</th>
                                            <td>${switchInfo.modelName || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">Serial Number</th>
                                            <td>${switchInfo.serialNumber || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">Version</th>
                                            <td>${switchInfo.version || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">System MAC</th>
                                            <td>${switchInfo.systemMacAddress || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">Uptime</th>
                                            <td>${uptime}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Memory Usage</h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <span>Memory Usage</span>
                                        <span>${memUsagePercent}%</span>
                                    </div>
                                    <div class="progress">
                                        <div class="progress-bar" role="progressbar" style="width: ${memUsagePercent}%" 
                                            aria-valuenow="${memUsagePercent}" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>
                                </div>
                                <table class="table table-sm">
                                    <tbody>
                                        <tr>
                                            <th scope="row">Total Memory</th>
                                            <td>${memTotal} MB</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">Used Memory</th>
                                            <td>${memUsed} MB</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">Free Memory</th>
                                            <td>${memFree} MB</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">System Information</h5>
                            </div>
                            <div class="card-body">
                                <table class="table table-sm">
                                    <tbody>
                                        <tr>
                                            <th scope="row">Architecture</th>
                                            <td>${switchInfo.architecture || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">Hardware Revision</th>
                                            <td>${switchInfo.hardwareRevision || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">Internal Version</th>
                                            <td>${switchInfo.internalVersion || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">Manufacturer</th>
                                            <td>${switchInfo.mfgName || 'N/A'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Set HTML
            switchInfoEl.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading switch information:', error);
            switchInfoEl.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Error loading switch information: ${error.message}
                </div>
            `;
        });
}

// Helper function to format uptime in a human-readable format
function formatUptime(seconds) {
    if (!seconds) return 'Unknown';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    let uptime = '';
    if (days > 0) uptime += `${days} day${days !== 1 ? 's' : ''} `;
    if (hours > 0 || days > 0) uptime += `${hours} hour${hours !== 1 ? 's' : ''} `;
    uptime += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    
    return uptime;
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadSwitchInfo();
});
