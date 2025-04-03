// Function to load interfaces with detailed information
function loadInterfaces() {
    const interfacesInfoEl = document.getElementById('interfacesInfo');
    
    // Show loading indicator
    interfacesInfoEl.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading interfaces...</p>
        </div>
    `;
    
    // Fetch interfaces from API
    fetch(apiUrl + '/interfaces')
        .then(response => {
            console.log('Interfaces response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Interfaces data:', data);
            
            if (!data || data.length === 0) {
                interfacesInfoEl.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        No interfaces found
                    </div>
                `;
                return;
            }
            
            // Filter out non-Ethernet interfaces for simplicity
            const ethernetInterfaces = data.filter(iface => 
                iface.name.startsWith('Ethernet') && 
                !iface.name.includes('Vlan') && 
                !iface.name.includes('Vxlan')
            );
            
            // Sort interfaces by name
            ethernetInterfaces.sort((a, b) => {
                // Extract interface type and number
                const aMatch = a.name.match(/([a-zA-Z]+)(\d+(?:\/\d+)*)/);
                const bMatch = b.name.match(/([a-zA-Z]+)(\d+(?:\/\d+)*)/);
                
                if (aMatch && bMatch) {
                    // Compare interface numbers
                    const aParts = aMatch[2].split('/').map(Number);
                    const bParts = bMatch[2].split('/').map(Number);
                    
                    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
                        if (aParts[i] !== bParts[i]) {
                            return aParts[i] - bParts[i];
                        }
                    }
                    
                    return aParts.length - bParts.length;
                }
                
                // Fallback to string comparison
                return a.name.localeCompare(b.name);
            });
            
            // Create table HTML
            let tableHtml = `
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Interface</th>
                                <th>Description</th>
                                <th>Admin Status</th>
                                <th>Link Status</th>
                                <th>Mode</th>
                                <th>VLAN</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            // Add each interface to the table
            ethernetInterfaces.forEach(iface => {
                // Format admin status
                const adminStatus = iface.enabled ? 
                    '<span class="badge bg-success">Up</span>' : 
                    '<span class="badge bg-secondary">Down</span>';
                
                // For link status, we'll use a simple approach based on enabled status
                // In a real implementation, this would come from the lineProtocolStatus
                const linkStatus = iface.enabled ? 
                    '<span class="badge bg-success">Up</span>' : 
                    '<span class="badge bg-danger">Down</span>';
                
                // Default mode and VLAN
                let mode = 'Access';
                let vlan = '1';
                
                tableHtml += `
                    <tr>
                        <td>${iface.name}</td>
                        <td>${iface.description || ''}</td>
                        <td>${adminStatus}</td>
                        <td>${linkStatus}</td>
                        <td>${mode}</td>
                        <td>${vlan}</td>
                        <td>
                            <button class="btn btn-sm btn-primary configure-port" data-interface="${iface.name}">
                                <i class="bi bi-gear me-1"></i>Configure
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            tableHtml += `
                        </tbody>
                    </table>
                </div>
            `;
            
            // Set table HTML
            interfacesInfoEl.innerHTML = tableHtml;
            
            // Add event listeners to configure buttons
            document.querySelectorAll('.configure-port').forEach(button => {
                button.addEventListener('click', function() {
                    const interfaceName = this.getAttribute('data-interface');
                    const interfaceData = ethernetInterfaces.find(iface => iface.name === interfaceName);
                    showPortConfigForm(interfaceName, interfaceData);
                });
            });
        })
        .catch(error => {
            console.error('Error loading interfaces:', error);
            interfacesInfoEl.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Error loading interfaces: ${error.message}
                </div>
            `;
        });
}

// Function to show port configuration form
function showPortConfigForm(interfaceName, interfaceData) {
    // Set selected port name
    document.getElementById('selectedPort').textContent = interfaceName;
    
    // Fill form with current interface data
    document.getElementById('portDescription').value = interfaceData.description || '';
    document.getElementById('portMode').value = 'access'; // Default to access mode
    document.getElementById('accessVlan').value = '1'; // Default VLAN
    document.getElementById('adminStatus').value = interfaceData.enabled ? 'up' : 'down';
    document.getElementById('speed').value = 'auto'; // Default to auto
    document.getElementById('duplex').value = 'auto'; // Default to auto
    
    // Show access VLAN fields by default
    document.getElementById('accessVlanGroup').style.display = 'block';
    document.getElementById('trunkVlansGroup').style.display = 'none';
    document.getElementById('nativeVlanGroup').style.display = 'none';
    
    // Set up port mode change handler
    document.getElementById('portMode').onchange = function() {
        if (this.value === 'access') {
            document.getElementById('accessVlanGroup').style.display = 'block';
            document.getElementById('trunkVlansGroup').style.display = 'none';
            document.getElementById('nativeVlanGroup').style.display = 'none';
        } else if (this.value === 'trunk') {
            document.getElementById('accessVlanGroup').style.display = 'none';
            document.getElementById('trunkVlansGroup').style.display = 'block';
            document.getElementById('nativeVlanGroup').style.display = 'block';
        }
    };
    
    // Set up cancel button
    document.getElementById('cancelPortBtn').onclick = function() {
        document.getElementById('portConfigForm').style.display = 'none';
    };
    
    // Set up save button
    document.getElementById('savePortBtn').onclick = function() {
        savePortConfiguration(interfaceName);
    };
    
    // Show form
    document.getElementById('portConfigForm').style.display = 'block';
}

// Function to save port configuration
function savePortConfiguration(interfaceName) {
    // Get form values
    const description = document.getElementById('portDescription').value;
    const mode = document.getElementById('portMode').value;
    const accessVlan = document.getElementById('accessVlan').value;
    const trunkVlans = document.getElementById('trunkVlans').value;
    const nativeVlan = document.getElementById('nativeVlan').value;
    const adminStatus = document.getElementById('adminStatus').value;
    const speed = document.getElementById('speed').value;
    const duplex = document.getElementById('duplex').value;
    
    // Prepare interface data
    const interfaceData = {
        description: description,
        enabled: adminStatus === 'up'
    };
    
    // Add switchport settings
    if (mode === 'access') {
        interfaceData.switchportMode = 'access';
        interfaceData.accessVlan = accessVlan;
    } else if (mode === 'trunk') {
        interfaceData.switchportMode = 'trunk';
        interfaceData.trunkAllowedVlans = trunkVlans;
        interfaceData.nativeVlan = nativeVlan;
    }
    
    // Add speed and duplex settings if not auto
    if (speed !== 'auto') {
        interfaceData.speed = speed;
    }
    if (duplex !== 'auto') {
        interfaceData.duplex = duplex;
    }
    
    // Show confirmation message
    if (confirm(`Are you sure you want to configure ${interfaceName} with these settings?`)) {
        // Send request to API
        fetch(`${apiUrl}/interfaces/${interfaceName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(interfaceData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Show success message
            alert(`Interface ${interfaceName} configured successfully`);
            
            // Hide form
            document.getElementById('portConfigForm').style.display = 'none';
            
            // Reload interfaces
            loadInterfaces();
        })
        .catch(error => {
            console.error('Error configuring interface:', error);
            alert(`Failed to configure interface: ${error.message}`);
        });
    }
}

// Initialize the port configuration tab when it's shown
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to tab
    document.querySelector('button[data-bs-target="#ports"]').addEventListener('click', function() {
        loadInterfaces();
    });
});
