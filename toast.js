// Toast notification system

/**
 * Show a toast notification
 * @param {string} type - Type of toast (success, error, warning, info)
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds (default: 5000)
 */
function showToast(type, message, duration = 5000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Set icon based on type
    let icon = '';
    let bgClass = '';
    
    switch (type) {
        case 'success':
            icon = '<i class="bi bi-check-circle-fill me-2"></i>';
            bgClass = 'bg-success';
            break;
        case 'error':
            icon = '<i class="bi bi-exclamation-triangle-fill me-2"></i>';
            bgClass = 'bg-danger';
            break;
        case 'warning':
            icon = '<i class="bi bi-exclamation-circle-fill me-2"></i>';
            bgClass = 'bg-warning';
            break;
        case 'info':
        default:
            icon = '<i class="bi bi-info-circle-fill me-2"></i>';
            bgClass = 'bg-info';
            break;
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${bgClass} text-white mb-3`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="toast-header ${bgClass} text-white">
            ${icon}
            <strong class="me-auto">Arista Switch Manager</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: duration
    });
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}
