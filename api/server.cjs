/**
 * ARISTA SWITCH WEB UI - API SERVER
 * ================================
 * 
 * This server acts as an intermediary between the web frontend and the Arista switch.
 * It translates RESTful API requests into properly formatted JSON-RPC calls required by
 * the Arista eAPI system.
 * 
 * ARCHITECTURE OVERVIEW:
 * ---------------------
 * 1. Frontend makes RESTful calls to this server (GET /interfaces, PUT /vlans/10, etc.)
 * 2. This server converts those calls into Arista CLI commands
 * 3. Commands are sent to the switch using JSON-RPC format via eAPI
 * 4. Responses are transformed into a format expected by the frontend
 * 
 * CRITICAL NOTES FOR TROUBLESHOOTING:
 * ----------------------------------
 * - This file MUST use .cjs extension because it uses CommonJS (require) syntax
 *   while the project's package.json specifies "type": "module"
 * - If renamed to .js, it will fail with "require is not defined in ES module scope"
 * - The Arista switch must have eAPI enabled (management api http-commands / no shutdown)
 * - Default credentials: admin/Xm5909ona@@+ for switch at 192.168.88.17
 * - This server listens on port 3000 by default
 * - CORS is enabled for all origins to support development
 * 
 * COMMON ISSUES:
 * -------------
 * 1. Connection refused: Check if server is running (systemctl status arista-api)
 * 2. Authentication failed: Verify Arista credentials below
 * 3. Blank frontend: Check browser console for CORS or connection errors
 * 4. "Module not found": Ensure you're using Node.js 18+ and the cjs extension
 */

const http = require('http');
const https = require('https');
const url = require('url');

/**
 * Arista switch credentials - Edit these to match your environment
 * For security in production, these should be loaded from environment variables
 */
const credentials = {
  username: 'admin',          // Default username for switch
  password: 'Xm5909ona@@+',   // Default password for switch
  host: '192.168.88.17',      // IP address of the Arista switch
};

/**
 * Converts RESTful paths and HTTP methods to appropriate Arista CLI commands
 * 
 * Path format: /<resource>/<id> maps to appropriate show/configure commands
 * Examples:
 * - GET /interfaces → ['show interfaces']
 * - GET /interfaces/Ethernet1 → ['show interfaces Ethernet1']
 * - PUT /interfaces/Ethernet1 → ['configure', 'interface Ethernet1', ...config commands]
 * 
 * @param {string} path - The URL path (e.g., '/interfaces/Ethernet1')
 * @param {string} method - HTTP method (GET, PUT, etc.)
 * @param {object} body - Request body for PUT/POST requests
 * @returns {string[]} Array of Arista CLI commands
 */
function pathToCommands(path, method, body) {
  const segments = path.split('/').filter(s => s);
  const resource = segments[0];
  const resourceId = segments[1];
  
  // Default commands to return if no match
  let commands = ['show version'];
  
  // Handle different resources
  switch (resource) {
    case 'interfaces':
      if (method === 'GET') {
        commands = resourceId 
          ? [`show interfaces ${resourceId}`]
          : ['show interfaces'];
      } else if (method === 'PUT' && resourceId && body) {
        commands = [`configure`, `interface ${resourceId}`];
        
        // Add configuration commands based on body properties
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
      // Return basic system information if no resource matches
      commands = ['show version'];
  }
  
  return commands;
}

/**
 * Makes a request to the Arista eAPI using proper JSON-RPC format
 * 
 * Arista eAPI Requirements:
 * 1. All requests must be POST to /command-api endpoint
 * 2. JSON-RPC 2.0 format with method "runCmds"
 * 3. Basic Authentication header
 * 4. Commands are passed as an array in params.cmds
 * 
 * @param {string} path - Original API path for command mapping
 * @param {string} method - HTTP method (GET, PUT, etc.)
 * @param {object} body - Request body for configuration
 * @returns {Promise<object>} The parsed JSON response from the Arista switch
 */
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
    // WARNING: In production, you would want proper certificate validation
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

/**
 * Process and transform data from Arista response format to frontend-friendly format
 * 
 * The Arista switch returns data in a very specific format that needs to be 
 * transformed into the structure expected by the frontend components
 * 
 * @param {object} data - Raw data from Arista eAPI response
 * @param {string} path - The original request path
 * @param {string} method - The original HTTP method
 * @returns {object} Processed data in the format expected by the frontend
 */
function processResponse(data, path, method) {
  let processedData = data;
  
  const segments = path.split('/').filter(s => s);
  const resource = segments[0];
  
  if (resource === 'interfaces' && !segments[1] && method === 'GET') {
    // Transform interfaces data from Arista format to frontend format
    processedData = Object.entries(data[0].interfaces || {}).map(([name, info]) => ({
      name,
      description: info.description || '',
      enabled: info.lineProtocolStatus === 'up',
      mtu: info.mtu || 1500,
      type: info.interfaceType || 'unknown',
      vlanId: info.accessVlanId || null
    }));
  } else if (resource === 'vlans' && !segments[1] && method === 'GET') {
    // Transform vlans data from Arista format to frontend format
    processedData = Object.entries(data[0].vlans || {}).map(([id, info]) => ({
      id: parseInt(id),
      name: info.name || `VLAN${id}`,
      state: info.status === 'active' ? 'active' : 'suspended',
      interfaces: info.interfaces || []
    }));
  }
  
  return processedData;
}

/**
 * Create an HTTP server to handle API requests
 * 
 * This server exposes a RESTful API that the frontend uses to communicate
 * with the Arista switch. All requests are proxied to the switch's eAPI.
 */
const server = http.createServer(async (req, res) => {
  // Set CORS headers to allow requests from any origin (for development)
  // In production, you would want to restrict this to your specific frontend URL
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  try {
    // Parse the URL
    const parsedUrl = url.parse(req.url);
    const path = parsedUrl.pathname.replace('/arista', '');
    const method = req.method;
    
    // Simple test endpoint to verify server is running
    if (path === '/test') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'API server is running!' }));
      return;
    }
    
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
  console.log('Server ready to handle requests');
});

/**
 * USAGE EXAMPLES:
 * --------------
 * curl http://localhost:3000/arista/interfaces
 * curl http://localhost:3000/arista/vlans
 * curl http://localhost:3000/arista/vxlan
 * 
 * PRODUCTION DEPLOYMENT:
 * --------------------
 * This server should be managed by systemd (see install_robust.sh)
 * Check status: systemctl status arista-api
 * View logs: journalctl -u arista-api
 */
