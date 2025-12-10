// notifications.js - Enhanced Toast Notifications and Modal System
class NotificationSystem {
    constructor() {
        this.toastContainer = null;
        this.confirmationModal = null;
        this.activeToasts = new Set();
        this.modalStack = [];
        this.notificationHistory = [];
        this.isInitialized = false;
        this.init();
    }

    init() {
        console.log('NotificationSystem: Initializing...');
        
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            setTimeout(() => this.setup(), 100);
        }
    }

    setup() {
        try {
            console.log('NotificationSystem: Setting up...');
            
            this.createToastContainer();
            this.createConfirmationModal();
            this.setupKeyboardShortcuts();
            this.setupNotificationPanel();
            
            // Load notification preferences
            this.loadPreferences();
            
            this.isInitialized = true;
            console.log('NotificationSystem: Ready ✓');
            
            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('notifications:ready'));
            
        } catch (error) {
            console.error('NotificationSystem: Setup failed:', error);
            this.showFatalError('Notification system failed to initialize');
        }
    }

    // ===== TOAST NOTIFICATION SYSTEM =====
    
    showToast(message, type = 'info', duration = 5000) {
        if (!this.isInitialized) {
            console.warn('NotificationSystem: Not ready, queuing toast');
            setTimeout(() => this.showToast(message, type, duration), 100);
            return null;
        }
        
        const toast = this.createToastElement(message, type);
        this.toastContainer.appendChild(toast);
        this.activeToasts.add(toast);
        
        // Add to history (limit to 100)
        this.addToHistory({
            id: Date.now(),
            type,
            message,
            timestamp: new Date().toISOString(),
            read: false
        });
        
        // Show with animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
            this.animateToastIn(toast);
        });
        
        // Auto-dismiss if duration > 0
        if (duration > 0) {
            this.setupAutoDismiss(toast, duration);
        }
        
        // Add click to dismiss
        toast.addEventListener('click', (e) => {
            if (!e.target.closest('.toast-close')) {
                this.dismissToast(toast);
            }
        });
        
        // Play sound for important notifications
        if (type === 'error' || type === 'warning') {
            this.playNotificationSound(type);
        }
        
        // Update notification badge
        this.updateNotificationBadge();
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('toast:shown', {
            detail: { toast, type, message }
        }));
        
        return toast;
    }
    
    createToastElement(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        toast.setAttribute('aria-label', `${type} notification`);
        
        const icon = this.getToastIcon(type);
        const title = this.getToastTitle(type);
        const progressBar = type !== 'loading' ? '<div class="toast-progress"></div>' : '';
        
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon" aria-hidden="true">${icon}</div>
                <div class="toast-body">
                    <div class="toast-title">${title}</div>
                    <div class="toast-message">${message}</div>
                </div>
                <button class="toast-close" aria-label="Close notification">
                    <svg><use href="assets/icons/x-icon.svg#x"></use></svg>
                </button>
            </div>
            ${progressBar}
        `;
        
        // Add close button event
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.dismissToast(toast);
        });
        
        return toast;
    }
    
    getToastIcon(type) {
        const icons = {
            success: '<svg class="toast-icon-svg"><use href="assets/icons/check-circle-icon.svg#check-circle"></use></svg>',
            error: '<svg class="toast-icon-svg"><use href="assets/icons/alert-circle-icon.svg#alert-circle"></use></svg>',
            warning: '<svg class="toast-icon-svg"><use href="assets/icons/alert-triangle-icon.svg#alert-triangle"></use></svg>',
            info: '<svg class="toast-icon-svg"><use href="assets/icons/info-icon.svg#info"></use></svg>',
            loading: '<div class="toast-spinner" aria-label="Loading"></div>'
        };
        return icons[type] || icons.info;
    }
    
    getToastTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information',
            loading: 'Processing'
        };
        return titles[type] || 'Notification';
    }
    
    animateToastIn(toast) {
        // Add entrance animation
        toast.style.animation = 'toastSlideIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        // Remove animation after it completes
        setTimeout(() => {
            toast.style.animation = '';
        }, 300);
    }
    
    setupAutoDismiss(toast, duration) {
        const progressBar = toast.querySelector('.toast-progress');
        if (progressBar) {
            progressBar.style.animationDuration = `${duration}ms`;
        }
        
        const dismissTimer = setTimeout(() => {
            this.dismissToast(toast);
        }, duration);
        
        toast.dataset.dismissTimer = dismissTimer;
    }
    
    dismissToast(toast) {
        if (!toast || !this.activeToasts.has(toast)) return;
        
        // Clear auto-dismiss timer
        clearTimeout(toast.dataset.dismissTimer);
        
        // Add exit animation
        toast.classList.remove('show');
        toast.classList.add('hiding');
        toast.style.animation = 'toastSlideOut 0.3s ease forwards';
        
        // Remove after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.activeToasts.delete(toast);
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('toast:dismissed', {
                detail: { toast }
            }));
        }, 300);
    }
    
    dismissAllToasts() {
        this.activeToasts.forEach(toast => {
            this.dismissToast(toast);
        });
        
        window.showToast('All notifications cleared', 'info', 2000);
    }
    
    showLoadingToast(message = 'Loading...', options = {}) {
        const toast = this.showToast(message, 'loading', 0);
        
        if (toast && options.id) {
            toast.dataset.loadingId = options.id;
        }
        
        return {
            toast,
            update: (newMessage) => {
                if (toast) {
                    const messageEl = toast.querySelector('.toast-message');
                    if (messageEl) {
                        messageEl.textContent = newMessage;
                    }
                }
            },
            dismiss: () => {
                if (toast) {
                    this.dismissToast(toast);
                }
            },
            success: (successMessage = 'Completed!') => {
                if (toast) {
                    this.dismissToast(toast);
                    this.showToast(successMessage, 'success');
                }
            },
            error: (errorMessage = 'Failed!') => {
                if (toast) {
                    this.dismissToast(toast);
                    this.showToast(errorMessage, 'error');
                }
            }
        };
    }
    
    // ===== CONFIRMATION MODAL SYSTEM =====
    
    async showConfirmation(options) {
        return new Promise((resolve) => {
            const {
                title = 'Confirm Action',
                message = 'Are you sure you want to perform this action?',
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                type = 'danger',
                showCancel = true,
                destructive = false,
                icon = null
            } = options;
            
            // Create modal instance
            const modal = this.createModal('confirmation');
            
            // Update content
            modal.querySelector('.modal-title').textContent = title;
            modal.querySelector('.modal-message').textContent = message;
            
            const confirmBtn = modal.querySelector('.modal-confirm');
            confirmBtn.textContent = confirmText;
            confirmBtn.className = `btn btn-${type}`;
            if (destructive) {
                confirmBtn.classList.add('destructive');
            }
            
            const cancelBtn = modal.querySelector('.modal-cancel');
            cancelBtn.textContent = cancelText;
            cancelBtn.style.display = showCancel ? 'inline-block' : 'none';
            
            // Add icon if provided
            if (icon) {
                const iconContainer = document.createElement('div');
                iconContainer.className = `modal-icon modal-icon-${type}`;
                iconContainer.innerHTML = icon;
                modal.querySelector('.modal-content').insertBefore(iconContainer, modal.querySelector('.modal-title'));
            }
            
            // Show modal
            this.showModal(modal);
            this.modalStack.push(modal);
            
            // Event handlers
            const confirmHandler = () => {
                this.dismissModal(modal);
                resolve(true);
            };
            
            const cancelHandler = () => {
                this.dismissModal(modal);
                resolve(false);
            };
            
            const escapeHandler = (e) => {
                if (e.key === 'Escape' && this.getTopModal() === modal) {
                    e.preventDefault();
                    if (showCancel) cancelHandler();
                }
            };
            
            // Add listeners
            confirmBtn.addEventListener('click', confirmHandler);
            cancelBtn.addEventListener('click', cancelHandler);
            document.addEventListener('keydown', escapeHandler);
            
            // Focus trap
            this.setupFocusTrap(modal);
            
            // Store handlers for cleanup
            modal._handlers = { confirmHandler, cancelHandler, escapeHandler };
            
            // Auto-focus confirm button
            setTimeout(() => confirmBtn.focus(), 100);
        });
    }
    
    // ===== ALERT MODAL SYSTEM =====
    
    async showAlert(options) {
        return new Promise((resolve) => {
            const {
                title = 'Alert',
                message,
                buttonText = 'OK',
                type = 'info',
                icon = null,
                onClose = null
            } = options;
            
            const modal = this.createModal('alert');
            
            modal.querySelector('.modal-title').textContent = title;
            modal.querySelector('.modal-message').textContent = message;
            modal.querySelector('.modal-confirm').textContent = buttonText;
            modal.querySelector('.modal-confirm').className = `btn btn-${type}`;
            
            // Add icon
            if (icon) {
                const iconContainer = document.createElement('div');
                iconContainer.className = `modal-icon modal-icon-${type}`;
                iconContainer.innerHTML = icon;
                modal.querySelector('.modal-content').insertBefore(iconContainer, modal.querySelector('.modal-title'));
            }
            
            this.showModal(modal);
            this.modalStack.push(modal);
            
            const okHandler = () => {
                this.dismissModal(modal);
                if (onClose) onClose();
                resolve();
            };
            
            modal.querySelector('.modal-confirm').addEventListener('click', okHandler);
            modal._handlers = { okHandler };
            
            // Setup escape key
            const escapeHandler = (e) => {
                if (e.key === 'Escape' && this.getTopModal() === modal) {
                    e.preventDefault();
                    okHandler();
                }
            };
            document.addEventListener('keydown', escapeHandler);
            modal._handlers.escapeHandler = escapeHandler;
            
            setTimeout(() => modal.querySelector('.modal-confirm').focus(), 100);
        });
    }
    
    // ===== PROGRESS MODAL SYSTEM =====
    
    showProgress(options) {
        const {
            title = 'Processing...',
            message = 'Please wait while we process your request.',
            showCancel = false,
            cancelText = 'Cancel',
            indeterminate = true,
            value = 0,
            max = 100
        } = options;
        
        const modal = this.createModal('progress');
        
        modal.querySelector('.modal-title').textContent = title;
        modal.querySelector('.modal-message').textContent = message;
        
        const cancelBtn = modal.querySelector('.modal-cancel');
        cancelBtn.textContent = cancelText;
        cancelBtn.style.display = showCancel ? 'inline-block' : 'none';
        
        // Setup progress bar
        const progressBar = modal.querySelector('.progress-bar');
        const progressText = modal.querySelector('.progress-text');
        
        if (indeterminate) {
            progressBar.classList.add('indeterminate');
        } else {
            this.updateProgressBar(progressBar, progressText, value, max);
        }
        
        this.showModal(modal);
        this.modalStack.push(modal);
        
        const controller = {
            modal,
            update: (newOptions) => {
                if (newOptions.title) {
                    modal.querySelector('.modal-title').textContent = newOptions.title;
                }
                if (newOptions.message) {
                    modal.querySelector('.modal-message').textContent = newOptions.message;
                }
                if (newOptions.value !== undefined) {
                    this.updateProgressBar(progressBar, progressText, newOptions.value, newOptions.max || max);
                }
            },
            dismiss: () => {
                this.dismissModal(modal);
            },
            set onCancel(callback) {
                if (showCancel) {
                    cancelBtn.onclick = () => {
                        callback();
                        this.dismissModal(modal);
                    };
                }
            }
        };
        
        // Setup escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && this.getTopModal() === modal && showCancel) {
                e.preventDefault();
                cancelBtn.click();
            }
        };
        document.addEventListener('keydown', escapeHandler);
        modal._handlers = { escapeHandler };
        
        return controller;
    }
    
    updateProgressBar(progressBar, progressText, value, max) {
        const percentage = Math.min(100, Math.max(0, (value / max) * 100));
        progressBar.style.width = `${percentage}%`;
        
        if (progressText) {
            progressText.textContent = `${Math.round(percentage)}%`;
        }
    }
    
    // ===== BATCH OPERATIONS =====
    
    showBatchProgress(total, operation, options = {}) {
        let completed = 0;
        let failed = 0;
        
        const progress = this.showProgress({
            title: options.title || operation,
            message: `${operation} (0/${total})`,
            showCancel: options.cancellable || false,
            indeterminate: false,
            value: 0,
            max: total
        });
        
        const update = (success = true) => {
            if (success) {
                completed++;
            } else {
                failed++;
            }
            
            const processed = completed + failed;
            const percentage = (processed / total) * 100;
            
            progress.update({
                message: `${operation} (${processed}/${total})${failed > 0 ? ` - ${failed} failed` : ''}`,
                value: processed
            });
            
            if (processed === total) {
                setTimeout(() => {
                    progress.dismiss();
                    
                    if (failed === 0) {
                        this.showToast(`${operation} completed successfully!`, 'success');
                    } else {
                        this.showToast(`${operation} completed with ${failed} failure(s)`, failed === total ? 'error' : 'warning');
                    }
                }, 500);
            }
        };
        
        return {
            update,
            cancel: () => progress.dismiss(),
            getProgress: () => ({ completed, failed, total })
        };
    }
    
    // ===== NOTIFICATION HISTORY & PANEL =====
    
    setupNotificationPanel() {
        // Create notification panel if it doesn't exist
        if (!document.getElementById('notificationPanel')) {
            const panel = document.createElement('div');
            panel.id = 'notificationPanel';
            panel.className = 'notification-panel';
            panel.innerHTML = `
                <div class="panel-header">
                    <h3>Notifications</h3>
                    <button class="panel-close">
                        <svg><use href="assets/icons/x-icon.svg#x"></use></svg>
                    </button>
                </div>
                <div class="panel-body">
                    <div class="notification-list" id="notificationList">
                        <!-- Notifications will be loaded here -->
                    </div>
                </div>
                <div class="panel-footer">
                    <button class="btn btn-text" id="clearAllNotifications">Clear All</button>
                    <button class="btn btn-text" id="markAllAsRead">Mark All as Read</button>
                </div>
            `;
            document.body.appendChild(panel);
            
            // Setup panel events
            this.setupPanelEvents();
        }
    }
    
    setupPanelEvents() {
        const panel = document.getElementById('notificationPanel');
        const closeBtn = panel.querySelector('.panel-close');
        const clearBtn = panel.querySelector('#clearAllNotifications');
        const markReadBtn = panel.querySelector('#markAllAsRead');
        
        closeBtn.addEventListener('click', () => {
            panel.classList.remove('show');
        });
        
        clearBtn.addEventListener('click', () => {
            this.clearNotificationHistory();
            this.updateNotificationPanel();
        });
        
        markReadBtn.addEventListener('click', () => {
            this.markAllAsRead();
            this.updateNotificationPanel();
            this.updateNotificationBadge();
        });
        
        // Close panel when clicking outside
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                panel.classList.remove('show');
            }
        });
    }
    
    showNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            this.updateNotificationPanel();
            panel.classList.add('show');
            
            // Mark all as read when panel is opened
            this.markAllAsRead();
            this.updateNotificationBadge();
        }
    }
    
    updateNotificationPanel() {
        const list = document.getElementById('notificationList');
        if (!list) return;
        
        if (this.notificationHistory.length === 0) {
            list.innerHTML = `
                <div class="notification-empty">
                    <svg><use href="assets/icons/bell-off-icon.svg#bell-off"></use></svg>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }
        
        list.innerHTML = this.notificationHistory.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'} notification-${notification.type}">
                <div class="notification-icon">
                    ${this.getToastIcon(notification.type)}
                </div>
                <div class="notification-content">
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatTimeAgo(notification.timestamp)}</div>
                </div>
                <button class="notification-dismiss" data-id="${notification.id}">
                    <svg><use href="assets/icons/x-icon.svg#x"></use></svg>
                </button>
            </div>
        `).join('');
        
        // Add dismiss handlers
        list.querySelectorAll('.notification-dismiss').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.removeFromHistory(id);
                this.updateNotificationPanel();
                this.updateNotificationBadge();
            });
        });
    }
    
    addToHistory(notification) {
        this.notificationHistory.unshift(notification);
        
        // Keep only last 100 notifications
        if (this.notificationHistory.length > 100) {
            this.notificationHistory.pop();
        }
        
        // Save to localStorage
        this.saveHistory();
    }
    
    removeFromHistory(id) {
        this.notificationHistory = this.notificationHistory.filter(n => n.id !== id);
        this.saveHistory();
    }
    
    markAllAsRead() {
        this.notificationHistory.forEach(notification => {
            notification.read = true;
        });
        this.saveHistory();
    }
    
    clearNotificationHistory() {
        this.notificationHistory = [];
        this.saveHistory();
    }
    
    updateNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        if (!badge) return;
        
        const unreadCount = this.notificationHistory.filter(n => !n.read).length;
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
    
    // ===== UTILITY METHODS =====
    
    createToastContainer() {
        this.toastContainer = document.getElementById('toastContainer');
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toastContainer';
            this.toastContainer.className = 'toast-container';
            document.body.appendChild(this.toastContainer);
        }
    }
    
    createConfirmationModal() {
        // Base modal templates are created on demand
    }
    
    createModal(type) {
        const template = this.getModalTemplate(type);
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = template;
        document.body.appendChild(modal);
        return modal;
    }
    
    getModalTemplate(type) {
        const templates = {
            confirmation: `
                <div class="modal-content">
                    <h3 class="modal-title"></h3>
                    <p class="modal-message"></p>
                    <div class="modal-actions">
                        <button class="btn btn-text modal-cancel">Cancel</button>
                        <button class="btn modal-confirm">Confirm</button>
                    </div>
                </div>
            `,
            alert: `
                <div class="modal-content">
                    <h3 class="modal-title"></h3>
                    <p class="modal-message"></p>
                    <div class="modal-actions">
                        <button class="btn modal-confirm">OK</button>
                    </div>
                </div>
            `,
            progress: `
                <div class="modal-content">
                    <h3 class="modal-title"></h3>
                    <p class="modal-message"></p>
                    <div class="progress-container">
                        <div class="progress-bar"></div>
                        <span class="progress-text"></span>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-text modal-cancel">Cancel</button>
                    </div>
                </div>
            `
        };
        return templates[type] || templates.alert;
    }
    
    showModal(modal) {
        modal.style.display = 'flex';
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
    }
    
    dismissModal(modal) {
        modal.classList.remove('show');
        
        // Remove from stack
        const index = this.modalStack.indexOf(modal);
        if (index > -1) {
            this.modalStack.splice(index, 1);
        }
        
        // Cleanup handlers
        if (modal._handlers) {
            if (modal._handlers.escapeHandler) {
                document.removeEventListener('keydown', modal._handlers.escapeHandler);
            }
        }
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
    
    getTopModal() {
        return this.modalStack[this.modalStack.length - 1];
    }
    
    setupFocusTrap(modal) {
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        modal.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+D to dismiss all toasts
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.dismissAllToasts();
            }
            
            // Ctrl+Shift+N to show notification panel
            if (e.ctrlKey && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                this.showNotificationPanel();
            }
            
            // Escape to close top modal
            if (e.key === 'Escape' && this.modalStack.length > 0) {
                const topModal = this.getTopModal();
                if (topModal) {
                    e.preventDefault();
                    const cancelBtn = topModal.querySelector('.modal-cancel') || 
                                    topModal.querySelector('.modal-confirm');
                    if (cancelBtn) {
                        cancelBtn.click();
                    }
                }
            }
        });
    }
    
    formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }
    
    playNotificationSound(type) {
        // Check if sounds are enabled
        if (localStorage.getItem('notificationSounds') === 'false') {
            return;
        }
        
        // Create audio context for simple beeps
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Different frequencies for different types
            const frequencies = {
                success: 800,
                error: 400,
                warning: 600,
                info: 700
            };
            
            oscillator.frequency.setValueAtTime(frequencies[type] || 600, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
            
        } catch (error) {
            console.warn('Could not play notification sound:', error);
        }
    }
    
    loadPreferences() {
        // Load notification preferences from localStorage
        const prefs = {
            sounds: localStorage.getItem('notificationSounds') !== 'false',
            autoDismiss: localStorage.getItem('notificationAutoDismiss') !== 'false',
            position: localStorage.getItem('notificationPosition') || 'top-right'
        };
        
        // Apply position
        this.toastContainer.className = `toast-container ${prefs.position}`;
        
        return prefs;
    }
    
    savePreferences(prefs) {
        Object.entries(prefs).forEach(([key, value]) => {
            localStorage.setItem(`notification${key.charAt(0).toUpperCase() + key.slice(1)}`, value);
        });
        
        // Re-apply
        this.loadPreferences();
    }
    
    saveHistory() {
        try {
            localStorage.setItem('notificationHistory', JSON.stringify(this.notificationHistory));
        } catch (error) {
            console.warn('Could not save notification history:', error);
        }
    }
    
    loadHistory() {
        try {
            const saved = localStorage.getItem('notificationHistory');
            if (saved) {
                this.notificationHistory = JSON.parse(saved);
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.warn('Could not load notification history:', error);
        }
    }
    
    showFatalError(message) {
        console.error('NotificationSystem Fatal:', message);
        
        // Create simple fallback
        const fallback = document.createElement('div');
        fallback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 9999;
            max-width: 300px;
        `;
        fallback.textContent = message;
        document.body.appendChild(fallback);
        
        setTimeout(() => {
            if (fallback.parentNode) {
                fallback.parentNode.removeChild(fallback);
            }
        }, 5000);
    }
    
    // ===== QUICK HELPER METHODS =====
    
    showSuccess(message, duration = 5000) {
        return this.showToast(message, 'success', duration);
    }
    
    showError(message, duration = 5000) {
        return this.showToast(message, 'error', duration);
    }
    
    showWarning(message, duration = 5000) {
        return this.showToast(message, 'warning', duration);
    }
    
    showInfo(message, duration = 5000) {
        return this.showToast(message, 'info', duration);
    }
}

// Initialize notification system
document.addEventListener('DOMContentLoaded', () => {
    window.notificationSystem = new NotificationSystem();
    
    // Global helper functions
    window.showToast = (message, type = 'info', duration = 5000) => {
        return window.notificationSystem?.showToast(message, type, duration) || null;
    };
    
    window.showSuccess = (message, duration = 5000) => {
        return window.notificationSystem?.showSuccess(message, duration) || null;
    };
    
    window.showError = (message, duration = 5000) => {
        return window.notificationSystem?.showError(message, duration) || null;
    };
    
    window.showWarning = (message, duration = 5000) => {
        return window.notificationSystem?.showWarning(message, duration) || null;
    };
    
    window.showInfo = (message, duration = 5000) => {
        return window.notificationSystem?.showInfo(message, duration) || null;
    };
    
    window.showConfirmation = (options) => {
        return window.notificationSystem?.showConfirmation(options) || Promise.resolve(false);
    };
    
    window.showAlert = (options) => {
        return window.notificationSystem?.showAlert(options) || Promise.resolve();
    };
    
    window.showProgress = (options) => {
        return window.notificationSystem?.showProgress(options) || { dismiss: () => {} };
    };
    
    window.showBatchProgress = (total, operation, options) => {
        return window.notificationSystem?.showBatchProgress(total, operation, options) || {
            update: () => {},
            cancel: () => {},
            getProgress: () => ({ completed: 0, failed: 0, total: 0 })
        };
    };
    
    window.showLoadingToast = (message, options) => {
        return window.notificationSystem?.showLoadingToast(message, options) || {
            update: () => {},
            dismiss: () => {},
            success: () => {},
            error: () => {}
        };
    };
    
    console.log('Notification helpers loaded ✓');
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
}