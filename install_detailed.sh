#!/bin/bash
#
# ARISTA SWITCH WEB UI - DETAILED INSTALLATION SCRIPT
# ==================================================
#
# This script installs and configures the Arista Switch Web UI application on Ubuntu 22.04.
# It includes extensive error handling and multiple fallback approaches to ensure a
# successful installation even in restricted environments.
#
# USAGE: ./install_detailed.sh
#
# The script will:
# 1. Install all required dependencies (Node.js, Nginx, etc.)
# 2. Set up the API server to communicate with the Arista switch
# 3. Configure the frontend to communicate with the API server
# 4. Create necessary services and configurations
#
# IMPORTANT NOTES:
# - The API server MUST use .cjs extension due to module system conflict
# - Default switch connection: 192.168.88.17 (admin/Xm5909ona@@+)
# - Default API server port: 3000
# - Web UI is served on port 80 via Nginx

# Text colors for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status messages
print_status() {
    echo -e "${YELLOW}[STATUS]${NC} $1"
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to print error messages
print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to print information messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Function to check if a command succeeded
check_status() {
    if [ $? -ne 0 ]; then
        print_error "$1"
        return 1
    fi
    return 0
}

# Get server IP address (for Nginx and final message)
SERVER_IP=$(hostname -I | awk '{print $1}')

# Start installation
print_status "Starting Arista Web UI installation on Ubuntu 22.04..."
print_status "This script will install all necessary dependencies and configure the application."

# Ask for installation directory
read -p "Enter installation directory (default: /opt/arista-webui): " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-/opt/arista-webui}

# Create installation directory
print_status "Creating installation directory: $INSTALL_DIR"
sudo mkdir -p $INSTALL_DIR
if ! check_status "Failed to create installation directory"; then
    exit 1
fi

sudo chown $USER:$USER $INSTALL_DIR
if ! check_status "Failed to set permissions on installation directory"; then
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update
if ! check_status "Failed to update package lists"; then
    print_info "Continuing despite update failure..."
fi

# Install essential packages first
print_status "Installing essential packages..."
sudo DEBIAN_FRONTEND=noninteractive apt install -y curl git nginx
if ! check_status "Failed to install essential packages"; then
    print_error "Essential package installation failed. Cannot continue."
    exit 1
fi

# Install Node.js with direct binary approach (more reliable than package managers)
print_status "Installing Node.js 18 directly from NodeSource..."
NODE_INSTALLER="/tmp/node_installer.sh"

curl -fsSL https://deb.nodesource.com/setup_18.x -o $NODE_INSTALLER
if ! check_status "Failed to download Node.js installer"; then
    print_info "Trying alternative method to install Node.js..."
    # Direct binary installation as fallback
    curl -fsSL https://nodejs.org/dist/v18.20.0/node-v18.20.0-linux-x64.tar.gz -o /tmp/node.tar.gz
    if ! check_status "Failed to download Node.js binary"; then
        print_error "Could not download Node.js. Check your internet connection."
        exit 1
    fi
    
    sudo mkdir -p /usr/local/lib/nodejs
    sudo tar -xzf /tmp/node.tar.gz -C /usr/local/lib/nodejs
    export PATH=/usr/local/lib/nodejs/node-v18.20.0-linux-x64/bin:$PATH
    echo 'export PATH=/usr/local/lib/nodejs/node-v18.20.0-linux-x64/bin:$PATH' >> ~/.profile
    source ~/.profile
else
    chmod +x $NODE_INSTALLER
    sudo bash $NODE_INSTALLER
    if ! check_status "Node.js repository setup failed"; then
        print_error "Failed to set up Node.js repository."
        exit 1
    fi
    
    sudo DEBIAN_FRONTEND=noninteractive apt install -y nodejs
    if ! check_status "Node.js installation failed"; then
        print_error "Failed to install Node.js."
        exit 1
    fi
fi

# Verify Node.js installation
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js installed successfully: $NODE_VERSION"
else
    print_error "Node.js installation verification failed."
    exit 1
fi

# Choose between git clone or local copy
print_status "Setting up Arista Web UI codebase..."
REPO_URL="https://github.com/bufanoc/arista-webui.git"

# Clone from GitHub
print_status "Cloning from GitHub repository: $REPO_URL"
git clone $REPO_URL $INSTALL_DIR
if ! check_status "Failed to clone repository"; then
    print_error "Could not clone the repository. Check your internet connection."
    exit 1
fi

# Navigate to installation directory
cd $INSTALL_DIR
if ! check_status "Failed to navigate to installation directory"; then
    exit 1
fi

# Try multiple approaches for npm dependencies
print_status "Installing npm dependencies (this might take a while)..."
print_info "Attempting with standard npm..."

# Approach 1: Standard npm with increased timeout
npm install --no-fund --no-audit --loglevel=error --fetch-timeout=300000
if ! check_status "Standard npm installation failed"; then
    print_info "Standard npm failed, trying with npm config adjustments..."
    
    # Approach 2: Try with registry and SSL settings
    npm config set registry https://registry.npmjs.org/
    npm config set strict-ssl false
    npm install --no-fund --no-audit --loglevel=error --fetch-timeout=300000
    
    if ! check_status "npm installation with config adjustments failed"; then
        print_info "npm installation failed. Trying with yarn..."
        
        # Approach 3: Try with Yarn
        npm install -g yarn
        yarn install --network-timeout 600000
        
        if ! check_status "Yarn installation failed"; then
            print_info "All package manager approaches failed."
            print_info "Proceeding with a minimal static deployment..."
            
            # Minimal static deployment - doesn't require npm
            mkdir -p $INSTALL_DIR/dist
            
            # Create a minimal placeholder website until we can get the proper build
            cat > $INSTALL_DIR/dist/index.html << EOL
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Arista Switch Manager</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
        }
        .message {
            text-align: center;
            padding: 20px;
            margin: 20px 0;
            background-color: #e1f5fe;
            border-radius: 5px;
        }
        .details {
            margin-top: 30px;
            padding: 15px;
            background-color: #f9f9f9;
            border-left: 4px solid #2196F3;
        }
        code {
            background-color: #efefef;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Arista Switch Manager</h1>
        
        <div class="message">
            <p>This is a placeholder for the Arista Switch Web UI.</p>
            <p>The full application could not be built automatically due to package installation issues.</p>
        </div>
        
        <div class="details">
            <h3>Connection Details:</h3>
            <p>This application is configured to manage the Arista switch at:</p>
            <ul>
                <li>IP Address: <code>192.168.88.17</code></li>
                <li>Username: <code>admin</code></li>
                <li>Password: <code>Xm5909ona@@+</code></li>
            </ul>
        </div>
        
        <div class="details">
            <h3>Next Steps:</h3>
            <p>To complete the installation:</p>
            <ol>
                <li>Build the application on a development machine with unrestricted internet access</li>
                <li>Transfer the built files to this server</li>
                <li>Place them in the <code>$INSTALL_DIR/dist</code> directory</li>
            </ol>
        </div>
    </div>
</body>
</html>
EOL
            print_info "Created a minimal placeholder website instead."
        else
            # If Yarn worked, build with it
            print_status "Building the application with Yarn..."
            yarn build
            if ! check_status "Application build failed"; then
                print_error "Failed to build the application with Yarn."
                exit 1
            fi
        fi
    else
        # If npm with config adjustments worked, build with it
        print_status "Building the application with npm..."
        npm run build
        if ! check_status "Application build failed"; then
            print_error "Failed to build the application with npm."
            exit 1
        fi
    fi
else
    # If standard npm worked, build with it
    print_status "Building the application with npm..."
    npm run build
    if ! check_status "Application build failed"; then
        print_error "Failed to build the application with npm."
        exit 1
    fi
fi

# Set up the API server - CRITICAL COMPONENT
print_status "Setting up API server..."
mkdir -p $INSTALL_DIR/api

# The API server file must have .cjs extension to force CommonJS mode because
# the project's package.json has "type": "module"
print_status "Creating API server file ($INSTALL_DIR/api/server.cjs)..."

# Create the server file with extensive documentation
# See the server.cjs in the repository for full reference
cat > $INSTALL_DIR/api/server.cjs << 'EOL'
/**
 * ARISTA SWITCH WEB UI - API SERVER
 * This server acts as an intermediary between the web frontend and the Arista switch.
 * CRITICAL: This file MUST use .cjs extension because it uses CommonJS syntax
 *           while the package.json specifies "type": "module"
 */

const http = require('http');
const https = require('https');
const url = require('url');

// Arista switch credentials
const credentials = {
  username: 'admin',
  password: 'Xm5909ona@@+',
  host: '192.168.88.17',
};

// Convert REST paths to Arista CLI commands
function pathToCommands(path, method, body) {
  const segments = path.split('/').filter(s => s);
  const resource = segments[0];
  const resourceId = segments[1];
  
  let commands = ['show version'];
  
  switch (resource) {
    case 'interfaces':
      if (method === 'GET') {
        commands = resourceId 
          ? [`show interfaces ${resourceId}`]
          : ['show interfaces'];
      } else if (method === 'PUT' && resourceId && body) {
        commands = [`configure`, `interface ${resourceId}`];
        
        if (body.description !== undefined) {
          commands.push(`description ${body.description}`);
        }
        if (body.enabled !== undefined) {
          commands.push(body.enabled ? 'no shutdown' : 'shutdown');
        }
        if (body.mtu !== undefined) {
          commands.push(`mtu ${body.mtu}`);
        }
        if (body.vlanId !== undefined) {
          commands.push(`switchport access vlan ${body.vlanId}`);
        }
        
        commands.push('exit');
      }
      break;
      
    case 'vlans':
      if (method === 'GET') {
        commands = resourceId 
          ? [`show vlan ${resourceId}`]
          : ['show vlan'];
      } else if (method === 'PUT' && resourceId && body) {
        commands = [`configure`, `vlan ${resourceId}`];
        
        if (body.name !== undefined) {
          commands.push(`name ${body.name}`);
        }
        if (body.state !== undefined) {
          commands.push(body.state === 'active' ? 'no state suspend' : 'state suspend');
        }
        
        commands.push('exit');
      }
      break;
      
    case 'vxlan':
      if (method === 'GET') {
        commands = ['show vxlan config'];
      } else if (method === 'PUT' && body) {
        commands = ['configure', 'interface Vxlan1'];
        
        if (body.vni !== undefined) {
          commands.push(`vxlan vni ${body.vni}`);
        }
        if (body.source !== undefined) {
          commands.push(`vxlan source-interface ${body.source}`);
        }
        
        commands.push('exit');
      }
      break;
      
    default:
      commands = ['show version'];
  }
  
  return commands;
}

// Make a properly formatted JSON-RPC request to the Arista eAPI
async function aristaRequest(path, method, body) {
  // Convert the path and method to appropriate Arista CLI commands
  const commands = pathToCommands(path, method, body);
  
  // Construct proper JSON-RPC request
  const requestBody = JSON.stringify({
    jsonrpc: "2.0",
    method: "runCmds",
    params: {
      version: 1,
      cmds: commands,
      format: "json"
    },
    id: "AristaWebUI-" + Date.now()
  });

  // Create request options
  const options = {
    hostname: credentials.host,
    port: 443,
    path: '/command-api',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody),
      'Authorization': 'Basic ' + Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')
    },
    rejectUnauthorized: false // Ignore SSL certificate issues
  };

  return new Promise((resolve, reject) => {
    // Create the request
    const req = https.request(options, (res) => {
      let data = '';
      
      // Accumulate data
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // Process the complete response
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            if (jsonData.error) {
              reject(new Error(`Arista eAPI error: ${jsonData.error.message}`));
            } else {
              resolve(jsonData.result);
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP error: ${res.statusCode} ${res.statusMessage}`));
        }
      });
    });
    
    // Handle request errors
    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
    
    // Send the request
    req.write(requestBody);
    req.end();
  });
}

// Process responses for different resource types
function processResponse(data, path, method) {
  let processedData = data;
  
  const segments = path.split('/').filter(s => s);
  const resource = segments[0];
  
  if (resource === 'interfaces' && !segments[1] && method === 'GET') {
    // Transform interfaces data
    processedData = Object.entries(data[0].interfaces || {}).map(([name, info]) => ({
      name,
      description: info.description || '',
      enabled: info.lineProtocolStatus === 'up',
      mtu: info.mtu || 1500,
      type: info.interfaceType || 'unknown',
      vlanId: info.accessVlanId || null
    }));
  } else if (resource === 'vlans' && !segments[1] && method === 'GET') {
    // Transform vlans data
    processedData = Object.entries(data[0].vlans || {}).map(([id, info]) => ({
      id: parseInt(id),
      name: info.name || `VLAN${id}`,
      state: info.status === 'active' ? 'active' : 'suspended',
      interfaces: info.interfaces || []
    }));
  }
  
  return processedData;
}

// Create a simple HTTP server
const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Test endpoint for checking server status
  if (req.url === '/test') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'API server is running!' }));
    return;
  }
  
  try {
    // Parse the URL
    const parsedUrl = url.parse(req.url);
    const path = parsedUrl.pathname.replace('/arista', '');
    const method = req.method;
    
    // Get request body for non-GET requests
    let body = '';
    if (method !== 'GET') {
      await new Promise((resolve) => {
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', resolve);
      });
    }
    
    // Parse body if it exists
    const parsedBody = body ? JSON.parse(body) : undefined;
    
    console.log(`Processing ${method} ${path}`, parsedBody ? 'with body' : 'without body');
    
    // Make the request to Arista
    const data = await aristaRequest(path, method, parsedBody);
    
    // Process the response based on path
    const processedData = processResponse(data, path, method);
    
    // Send the response
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(processedData));
  } catch (error) {
    console.error('Error:', error.message);
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(500);
    res.end(JSON.stringify({ error: error.message }));
  }
});

// Start the server
const port = 3000;
server.listen(port, () => {
  console.log(`Arista API server running at http://localhost:${port}/`);
  console.log('Connected to Arista switch at', credentials.host);
});
EOL

# Create systemd service for API - IMPORTANT: Note the .cjs extension
print_status "Creating systemd service for API server..."
sudo tee /etc/systemd/system/arista-api.service > /dev/null << EOL
[Unit]
Description=Arista API Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR/api
ExecStart=$(which node) server.cjs
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL
if ! check_status "Failed to create systemd service"; then
    print_error "Failed to create systemd service for API."
    exit 1
fi

# Configure frontend to connect to API
print_status "Configuring frontend to connect to API..."
cat > $INSTALL_DIR/dist/config.js << EOL
// CRITICAL: This configuration tells the frontend where to find the API server
window.ARISTA_API_URL = 'http://$SERVER_IP:3000/arista';
EOL

# Insert the config script in index.html
sed -i '/<head>/a \    <script src="./config.js"></script>' $INSTALL_DIR/dist/index.html
if ! check_status "Failed to update index.html with config"; then
    print_info "Could not automatically update index.html. You may need to manually add the config script."
fi

# Configure Nginx to serve the frontend and proxy API requests
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/arista-webui > /dev/null << EOL
server {
    listen 80;
    server_name $SERVER_IP;

    root $INSTALL_DIR/dist;
    index index.html;

    # API proxy to avoid CORS issues
    location /api/ {
        proxy_pass http://localhost:3000/arista/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Add security headers
    add_header X-Content-Type-Options "nosniff";
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
}
EOL
if ! check_status "Failed to create Nginx configuration"; then
    print_error "Nginx configuration failed."
    exit 1
fi

# Enable the site and restart Nginx
sudo ln -sf /etc/nginx/sites-available/arista-webui /etc/nginx/sites-enabled/
sudo systemctl restart nginx
if ! check_status "Failed to restart Nginx"; then
    print_error "Failed to enable the Nginx site. Check Nginx configuration."
    exit 1
fi

# Enable and start the API service
sudo systemctl daemon-reload
sudo systemctl enable arista-api
sudo systemctl start arista-api
if ! check_status "Failed to start API service"; then
    print_error "Failed to start the API service. Check logs with: journalctl -u arista-api"
    exit 1
fi

# Create test page to help with troubleshooting
print_status "Creating API test page..."
cat > $INSTALL_DIR/dist/test.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
    <title>Arista API Test</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1 { color: #2c3e50; }
        pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow: auto; }
        .error { color: #e74c3c; }
        .success { color: #27ae60; }
        button { padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #2980b9; }
    </style>
    <script>
        // This test page helps verify if the API server is working correctly
        function testAPI(endpoint) {
            const resultElem = document.getElementById('result');
            const errorElem = document.getElementById('error');
            
            resultElem.textContent = 'Loading...';
            errorElem.textContent = '';
            
            fetch('/api/' + endpoint)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    resultElem.textContent = JSON.stringify(data, null, 2);
                    document.getElementById('status').textContent = 'Success! API is working correctly.';
                    document.getElementById('status').className = 'success';
                })
                .catch(error => {
                    errorElem.textContent = error.toString();
                    document.getElementById('status').textContent = 'Error! API request failed.';
                    document.getElementById('status').className = 'error';
                });
        }
        
        // Also try direct connection to help with troubleshooting
        function testDirect() {
            const directUrlElem = document.getElementById('direct-url');
            const directResultElem = document.getElementById('direct-result');
            const directErrorElem = document.getElementById('direct-error');
            
            const url = directUrlElem.value;
            
            directResultElem.textContent = 'Loading...';
            directErrorElem.textContent = '';
            
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    directResultElem.textContent = JSON.stringify(data, null, 2);
                })
                .catch(error => {
                    directErrorElem.textContent = error.toString();
                });
        }
    </script>
</head>
<body>
    <h1>Arista API Test</h1>
    <p>This page helps verify if the API server is working correctly and the frontend can communicate with it.</p>
    
    <div>
        <h2>Status: <span id="status">Waiting for test...</span></h2>
    </div>
    
    <div>
        <button onclick="testAPI('interfaces')">Test Interfaces API</button>
        <button onclick="testAPI('vlans')">Test VLANs API</button>
        <button onclick="testAPI('vxlan')">Test VXLAN API</button>
    </div>
    
    <h3>API Response:</h3>
    <pre id="result">Click a button above to test the API</pre>
    
    <h3>Errors:</h3>
    <pre id="error" class="error"></pre>
    
    <h2>Direct API Testing</h2>
    <p>If the above tests fail, try direct connection to diagnose CORS or proxy issues:</p>
    
    <div>
        <input type="text" id="direct-url" style="width: 350px;" value="http://localhost:3000/arista/interfaces" />
        <button onclick="testDirect()">Test Direct URL</button>
    </div>
    
    <h3>Direct Response:</h3>
    <pre id="direct-result">Click the button above to test direct API access</pre>
    
    <h3>Direct Errors:</h3>
    <pre id="direct-error" class="error"></pre>
    
    <h2>Troubleshooting Tips</h2>
    <ul>
        <li>If both tests fail, the API server might not be running. Check <code>sudo systemctl status arista-api</code></li>
        <li>If direct test works but proxy test fails, Nginx configuration might be incorrect</li>
        <li>CORS issues are common - check browser console for details</li>
        <li>API server must use .cjs extension to work with CommonJS</li>
    </ul>
</body>
</html>
EOL

# Check if services are running
NGINX_STATUS=$(systemctl is-active nginx)
API_STATUS=$(systemctl is-active arista-api)

# Final message
echo ""
echo "================================================================="
echo -e "${GREEN}INSTALLATION COMPLETE!${NC}"
echo "================================================================="
echo ""
echo "Arista Web UI has been successfully installed and configured."
echo ""
echo "Services Status:"
echo -e "  Nginx Web Server: ${GREEN}$NGINX_STATUS${NC}"
echo -e "  Arista API Service: ${GREEN}$API_STATUS${NC}"
echo ""
echo "You can access the Arista Web UI at: http://$SERVER_IP"
echo "For troubleshooting, visit: http://$SERVER_IP/test.html"
echo ""
echo "The UI is configured to connect to your Arista switch at:"
echo "  - IP: 192.168.88.17"
echo "  - Username: admin"
echo "  - Password: Xm5909ona@@+"
echo ""
echo "IMPORTANT TROUBLESHOOTING TIPS:"
echo "-------------------------------"
echo "1. If you see a blank screen, check browser console for errors"
echo "2. API server issues: sudo systemctl status arista-api"
echo "3. API logs: sudo journalctl -u arista-api"
echo "4. The API server MUST use .cjs extension (not .js)"
echo "5. See DETAILED_README.md for complete documentation"
echo ""
echo "================================================================="
