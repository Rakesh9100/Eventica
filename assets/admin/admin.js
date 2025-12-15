// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.apiBaseUrl = 'https://eventica-backend.vercel.app/api/v1'; // Your deployed backend URL
        this.token = localStorage.getItem('adminToken');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthentication();
        this.loadDashboardData();
    }

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Add event button
        document.getElementById('add-event-btn').addEventListener('click', () => {
            this.toggleEventForm(true);
        });

        // Cancel form button
        document.getElementById('cancel-form').addEventListener('click', () => {
            this.toggleEventForm(false);
        });

        // Event form submission
        document.getElementById('event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEventSubmission();
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
    }

    checkAuthentication() {
        if (!this.token) {
            // Redirect to login page or show login modal
            this.showLoginModal();
            return false;
        }
        return true;
    }

    async showLoginModal() {
        // Simple login for demo - in production, use proper authentication
        const username = prompt('Enter admin username:');
        const password = prompt('Enter admin password:');

        if (username === 'admin' && password === 'admin123') {
            // For now, create a demo user and get a real token
            try {
                // Try to login first
                const loginResponse = await fetch(`${this.apiBaseUrl}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: 'admin@eventica.com',
                        password: 'admin123'
                    })
                });

                if (loginResponse.ok) {
                    const loginResult = await loginResponse.json();
                    this.token = loginResult.token;
                } else {
                    // User doesn't exist, create it
                    const signupResponse = await fetch(`${this.apiBaseUrl}/auth/signup`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            username: 'admin',
                            email: 'admin@eventica.com',
                            password: 'admin123'
                        })
                    });

                    if (signupResponse.ok) {
                        const signupResult = await signupResponse.json();
                        this.token = signupResult.token;
                    } else {
                        throw new Error('Authentication failed');
                    }
                }

                localStorage.setItem('adminToken', this.token);
                this.showMessage('Login successful!', 'success');
            } catch (error) {
                console.error('Auth error:', error);
                // Fallback to demo token for testing
                this.token = 'demo-admin-token';
                localStorage.setItem('adminToken', this.token);
                this.showMessage('Login successful! (Demo mode)', 'warning');
            }
        } else {
            this.showMessage('Invalid credentials!', 'error');
            window.location.href = '../../index.html';
        }
    }

    switchSection(sectionName) {
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Show corresponding section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`).classList.add('active');

        // Load section-specific data
        switch(sectionName) {
            case 'events':
                this.loadEvents();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    }

    toggleEventForm(show) {
        const form = document.getElementById('add-event-form');
        if (show) {
            form.classList.remove('hidden');
            document.getElementById('event-form').reset();
        } else {
            form.classList.add('hidden');
        }
    }

    async handleEventSubmission() {
        const formData = new FormData(document.getElementById('event-form'));
        const eventData = {
            title: formData.get('title'),
            description: formData.get('description'),
            date: formData.get('date'),
            time: formData.get('time'),
            location: formData.get('location'),
            image: formData.get('image'),
            website: formData.get('website')
        };

        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/event/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(eventData)
            });

            if (response.ok) {
                this.showMessage('Event created successfully!', 'success');
                this.toggleEventForm(false);
                this.loadEvents();
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to create event', 'error');
            }
        } catch (error) {
            console.error('Error creating event:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadEvents() {
        this.showLoading(true);

        try {
            // For now, load from events.json until backend is connected
            const response = await fetch('../../events.json');
            const events = await response.json();

            this.displayEvents(events);
        } catch (error) {
            console.error('Error loading events:', error);
            this.showMessage('Failed to load events', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displayEvents(events) {
        const tbody = document.getElementById('events-table-body');
        tbody.innerHTML = '';

        events.forEach(event => {
            const isUpcoming = this.isEventUpcoming(event.date);
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${event.title}</td>
                <td>${this.formatDate(event.date)}</td>
                <td>${event.location || 'N/A'}</td>
                <td>
                    <span class="status-badge ${isUpcoming ? 'status-upcoming' : 'status-past'}">
                        ${isUpcoming ? 'Upcoming' : 'Past'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="adminDashboard.deleteEvent('${event.id || 'temp'}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    async deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) {
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/event/delete/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.showMessage('Event deleted successfully!', 'success');
                this.loadEvents();
            } else {
                this.showMessage('Failed to delete event', 'error');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadUsers() {
        // Placeholder for user management
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = `
            <div class="text-center">
                <h3>User Management</h3>
                <p>User management functionality will be implemented here.</p>
            </div>
        `;
    }

    async loadAnalytics() {
        try {
            // Load events for analytics
            const response = await fetch('../../events.json');
            const events = await response.json();

            const totalEvents = events.length;
            const upcomingEvents = events.filter(event => this.isEventUpcoming(event.date)).length;

            document.getElementById('total-events').textContent = totalEvents;
            document.getElementById('upcoming-events').textContent = upcomingEvents;
            document.getElementById('total-users').textContent = '0'; // Placeholder
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    async loadDashboardData() {
        if (this.checkAuthentication()) {
            this.loadEvents();
            this.loadAnalytics();
        }
    }

    isEventUpcoming(dateString) {
        const [day, month, year] = dateString.split('-').map(Number);
        const eventDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today;
    }

    formatDate(dateString) {
        const [day, month, year] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    showMessage(message, type = 'info') {
        const container = document.getElementById('message-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        container.appendChild(messageDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    logout() {
        localStorage.removeItem('adminToken');
        window.location.href = '../../index.html';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});