#!/bin/bash

# Arista Web UI Installer
# This script installs and configures the Arista Web UI application on Ubuntu 22.04.5

# Text colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print status messages
print_status() {
    echo -e "${YELLOW}[STATUS]${NC} $1"
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to print error messages and exit
print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Function to check if a command succeeded
check_status() {
    if [ $? -ne 0 ]; then
        print_error "$1"
    fi
}

# Get server IP address (for Nginx and final message)
SERVER_IP=$(hostname -I | awk '{print $1}')

# Start installation
print_status "Starting Arista Web UI installation on Ubuntu 22.04.5..."
print_status "This script will install all necessary dependencies and configure the application."

# Ask for installation directory
read -p "Enter installation directory (default: /opt/arista-webui): " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-/opt/arista-webui}

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y
check_status "Failed to update system packages"

# Install Node.js
print_status "Installing Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    check_status "Failed to setup Node.js repository"
    
    sudo apt install -y nodejs
    check_status "Failed to install Node.js"
    
    print_success "Node.js installed successfully: $(node -v)"
else
    print_success "Node.js is already installed: $(node -v)"
fi

# Install other dependencies
print_status "Installing Git, Nginx and other dependencies..."
sudo apt install -y git nginx
check_status "Failed to install dependencies"

# Create installation directory
print_status "Creating installation directory: $INSTALL_DIR"
sudo mkdir -p $INSTALL_DIR
check_status "Failed to create installation directory"
sudo chown $USER:$USER $INSTALL_DIR
check_status "Failed to set permissions on installation directory"

# Clone the repository
print_status "Cloning Arista Web UI repository..."
# Check if it's a git repository or local files
if [ -d "$(pwd)/.git" ]; then
    # This is a git repository, clone it
    REPO_URL=$(git config --get remote.origin.url)
    if [ -z "$REPO_URL" ]; then
        # If no remote URL, copy files directly
        print_status "No git remote found, copying files directly..."
        cp -r $(pwd)/* $INSTALL_DIR/
    else
        git clone $REPO_URL $INSTALL_DIR
    fi
else
    # Copy current files directly
    print_status "Copying project files to installation directory..."
    cp -r $(pwd)/* $INSTALL_DIR/
fi
check_status "Failed to copy project files"

# Navigate to installation directory
cd $INSTALL_DIR
check_status "Failed to navigate to installation directory"

# Install npm dependencies
print_status "Installing npm dependencies..."
npm install
check_status "Failed to install npm dependencies"

# Build the application
print_status "Building the application..."
npm run build
check_status "Failed to build the application"

# Configure environment variables
print_status "Setting up environment variables..."
# Create .env.production file with Arista switch details
cat > .env.production << EOL
VITE_ARISTA_HOST=192.168.88.17
VITE_ARISTA_USERNAME=admin
VITE_ARISTA_PASSWORD=Xm5909ona@@+
EOL
check_status "Failed to create environment configuration"

# Setup Supabase
print_status "Setting up Supabase functions..."
if ! command -v supabase &> /dev/null; then
    print_status "Installing Supabase CLI..."
    npm install -g supabase
    check_status "Failed to install Supabase CLI"
fi

# Create Nginx configuration
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/arista-webui > /dev/null << EOL
server {
    listen 80;
    server_name $SERVER_IP;

    root $INSTALL_DIR/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOL
check_status "Failed to create Nginx configuration"

# Enable the site and restart Nginx
sudo ln -sf /etc/nginx/sites-available/arista-webui /etc/nginx/sites-enabled/
check_status "Failed to enable Nginx site"

sudo systemctl restart nginx
check_status "Failed to restart Nginx"

# Setup systemd service for Supabase functions
print_status "Setting up systemd service for Supabase functions..."
sudo tee /etc/systemd/system/arista-api.service > /dev/null << EOL
[Unit]
Description=Arista API Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$(which npx) supabase functions serve arista
Restart=on-failure
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL
check_status "Failed to create systemd service"

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable arista-api
sudo systemctl start arista-api
check_status "Failed to start API service"

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
echo ""
echo "The UI is configured to connect to your Arista switch at:"
echo "  - IP: 192.168.88.17"
echo "  - Username: admin"
echo "  - Password: Xm5909ona@@+"
echo ""
echo "If you need to change these settings, edit the .env.production file"
echo "located at: $INSTALL_DIR/.env.production"
echo ""
echo "================================================================="
