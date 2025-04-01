import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Converts REST-style paths and methods to Arista CLI commands
 */
function pathToCommands(path: string, method: string, body?: any): string[] {
  const segments = path.split('/').filter(s => s);
  const resource = segments[0];
  const resourceId = segments[1];
  
  // Default commands to return if no match
  let commands: string[] = ['show version'];
  
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
 */
async function aristaRequest(path: string, method: string = 'GET', body?: any) {
  const credentials = {
    username: 'admin',
    password: 'Xm5909ona@@+',
    host: '192.168.88.17',
  };
  
  // Convert the path and method to appropriate Arista CLI commands
  const commands = pathToCommands(path, method, body);
  
  // Construct proper JSON-RPC request
  const requestBody = {
    jsonrpc: "2.0",
    method: "runCmds",
    params: {
      version: 1,
      cmds: commands,
      format: "json"
    },
    id: "AristaWebUI-" + Date.now()
  };

  // Arista eAPI always uses HTTPS POST with the JSON-RPC body
  const response = await fetch(`https://${credentials.host}/command-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Arista API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Check for errors in the JSON-RPC response
  if (data.error) {
    throw new Error(`Arista eAPI error: ${data.error.message}`);
  }
  
  // Return the result part of the response
  return data.result;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/arista', '');
    const method = req.method;
    const body = method !== 'GET' ? await req.json() : undefined;

    const data = await aristaRequest(path, method, body);

    // Process the response data to match the expected format from the frontend
    let processedData = data;
    
    // Process data based on the path to transform Arista output format to the format expected by the frontend
    const segments = path.split('/').filter(s => s);
    const resource = segments[0];
    
    if (resource === 'interfaces' && !segments[1] && method === 'GET') {
      // Transform interfaces data
      processedData = Object.entries(data[0].interfaces || {}).map(([name, info]: [string, any]) => ({
        name,
        description: info.description || '',
        enabled: info.lineProtocolStatus === 'up',
        mtu: info.mtu || 1500,
        type: info.interfaceType || 'unknown',
        vlanId: info.accessVlanId || null
      }));
    } else if (resource === 'vlans' && !segments[1] && method === 'GET') {
      // Transform vlans data
      processedData = Object.entries(data[0].vlans || {}).map(([id, info]: [string, any]) => ({
        id: parseInt(id),
        name: info.name || `VLAN${id}`,
        state: info.status === 'active' ? 'active' : 'suspended',
        interfaces: info.interfaces || []
      }));
    }
    
    return new Response(JSON.stringify(processedData), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});