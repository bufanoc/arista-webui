# Arista Switch Web UI

## Overview and Architecture Documentation

This documentation is intended to provide comprehensive details about the Arista Switch Web UI application, its architecture, installation process, common issues, and troubleshooting guides.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Structure](#component-structure)
3. [Installation Guide](#installation-guide)
4. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
5. [API Reference](#api-reference)
6. [Frontend Configuration](#frontend-configuration)

## Architecture Overview

The Arista Switch Web UI is a modern web application designed to provide a user-friendly interface for managing Arista network switches. The application consists of three main components:

1. **React Frontend**: A responsive web UI built with React, TypeScript, and TailwindCSS
2. **API Server**: A Node.js server that acts as a bridge between the frontend and the Arista switch
3. **Arista eAPI**: The switch's native API that accepts commands via JSON-RPC

### Data Flow

```
Browser → React Frontend → API Server → Arista eAPI (Switch)
```

1. User interacts with the React UI
2. Frontend makes RESTful API calls to the API server
3. API server translates REST calls to Arista CLI commands
4. Commands are sent to the switch using JSON-RPC format via eAPI
5. Responses are transformed and sent back to the frontend

## Component Structure

### Frontend Components

- **Dashboard**: Overview of switch status, interfaces, and VLANs
- **Interfaces**: Management of physical and virtual interfaces
- **VLANs**: VLAN configuration and monitoring
- **VXLAN**: Virtual Extensible LAN configuration

### API Server

The API server (`server.cjs`) is a critical component that:

1. Exposes RESTful endpoints for the frontend
2. Translates RESTful operations to Arista CLI commands
3. Formats commands in JSON-RPC structure required by eAPI
4. Transforms switch responses to frontend-friendly format

### Communication Protocol

The frontend makes standard RESTful calls:
- `GET /interfaces` - List all interfaces
- `GET /interfaces/Ethernet1` - Get specific interface
- `PUT /interfaces/Ethernet1` - Update interface configuration
- etc.

The API server translates these into Arista CLI commands:
- `show interfaces`
- `show interfaces Ethernet1`
- `configure` + `interface Ethernet1` + config commands
- etc.

## Installation Guide

See the `install_detailed.sh` script for a complete, step-by-step installation process. Key points:

1. The API server must use the `.cjs` extension due to the module system conflict
2. Nginx is configured to proxy API requests and serve the frontend
3. Systemd manages the API server process
4. Default switch credentials: admin/Xm5909ona@@+ for switch at 192.168.88.17

## Common Issues & Troubleshooting

### API Server Issues

**Symptoms**: Frontend shows blank screen or can't connect to API

**Common causes and solutions**:

1. **Module System Conflict**
   - **Error**: "require is not defined in ES module scope"
   - **Solution**: Rename `server.js` to `server.cjs` to force CommonJS mode

2. **Connection Refused**
   - **Check**: `systemctl status arista-api` to see if service is running
   - **Solution**: `sudo systemctl restart arista-api`

3. **Authentication Failed**
   - **Check**: Verify credentials in `server.cjs`
   - **Solution**: Update with correct username/password/host

4. **CORS Issues**
   - **Check**: Browser console for CORS errors
   - **Solution**: Ensure CORS headers are set correctly in API server

### Frontend Issues

**Symptoms**: Blank page, loading forever, or component errors

**Common causes and solutions**:

1. **API URL Configuration**
   - **Check**: Browser console for failed network requests
   - **Solution**: Create/update `config.js` with correct API URL

2. **Build Issues**
   - **Check**: If dist/ directory exists and contains expected files
   - **Solution**: Rebuild with `npm run build` on a machine with unrestricted internet

## API Reference

### Available Endpoints

| Endpoint | Method | Description | Example Request Body |
|----------|--------|-------------|---------------------|
| `/interfaces` | GET | List all interfaces | N/A |
| `/interfaces/:name` | GET | Get specific interface | N/A |
| `/interfaces/:name` | PUT | Update interface | `{"description": "WAN", "enabled": true, "mtu": 1500, "vlanId": 10}` |
| `/vlans` | GET | List all VLANs | N/A |
| `/vlans/:id` | GET | Get specific VLAN | N/A |
| `/vlans/:id` | PUT | Update VLAN | `{"name": "Finance", "state": "active"}` |
| `/vxlan` | GET | Get VXLAN config | N/A |
| `/vxlan` | PUT | Update VXLAN config | `{"vni": 10000, "source": "Loopback0"}` |

## Frontend Configuration

The frontend needs configuration to know where to find the API server. This is managed by a `config.js` file that's inserted into the HTML:

```js
window.ARISTA_API_URL = 'http://<SERVER_IP>:3000/arista';
```

This file should be placed in the `dist/` directory and referenced in `index.html`.
