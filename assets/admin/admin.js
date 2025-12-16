// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:3001/api/v1'  // Local backend
            : 'https://eventica-backend.vercel.app/api/v1'; // Production backend
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

        // Modal close button
        document.getElementById('modal-close-btn').addEventListener('click', () => {
            this.toggleEventForm(false);
        });

        // Close modal when clicking outside
        document.getElementById('event-modal').addEventListener('click', (e) => {
            if (e.target.id === 'event-modal') {
                this.toggleEventForm(false);
            }
        });

        // Event form submission
        document.getElementById('event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEventSubmission();
        });

        // Add paste event listeners to clean invisible characters
        this.setupTextCleaning();

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
    }

    async checkAuthentication() {
        // Simple authentication - just check for admin credentials
        if (!this.token) {
            const username = prompt('Enter admin username:');
            const password = prompt('Enter admin password:');

            if (username === 'admin' && password === 'admin123') {
                this.token = 'admin-access';
                localStorage.setItem('adminToken', this.token);
                this.showMessage('Login successful!', 'success');
                return true;
            } else {
                this.showMessage('Invalid credentials! Use admin/admin123', 'error');
                window.location.href = '../../index.html';
                return false;
            }
        }
        return true;
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



    async handleEventSubmission() {
        const formData = new FormData(document.getElementById('event-form'));
        const eventData = {
            title: formData.get('title'),
            description: formData.get('description'),
            date: formData.get('date'),
            time: formData.get('time'),
            endTime: formData.get('endTime'),
            location: formData.get('location'),
            image: formData.get('image'),
            website: formData.get('website')
        };

        console.log('Event data:', eventData);
        console.log('Token:', this.token);

        this.showLoading(true);

        try {
            let response;
            let successMessage;

            if (this.editingEventId) {
                // Update existing event
                response = await fetch(`${this.apiBaseUrl}/event/update/${this.editingEventId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(eventData)
                });
                successMessage = 'Event updated successfully!';
            } else {
                // Create new event
                response = await fetch(`${this.apiBaseUrl}/event/add`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(eventData)
                });
                successMessage = 'Event created successfully!';
            }

            console.log('Response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Success result:', result);
                
                this.showMessage(successMessage, 'success');
                this.toggleEventForm(false);
                this.loadEvents();
                
                // Reset editing state
                this.editingEventId = null;
                document.querySelector('#event-form button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Save Event';
            } else {
                const error = await response.json();
                console.log('Error response:', error);
                this.showMessage(error.message || error.error || 'Failed to save event', 'error');
            }
        } catch (error) {
            console.error('Error saving event:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadEvents() {
        this.showLoading(true);

        try {
            // Load events ONLY from backend API (which reads from events.json)
            const response = await fetch(`${this.apiBaseUrl}/event/allevents`);
            
            if (response.ok) {
                const events = await response.json();
                console.log('Events loaded from backend (events.json):', events.length, 'events');
                
                // Convert to admin display format
                const formattedEvents = events.map(event => {
                    console.log('Processing event for admin:', event.title, 'ID:', event._id || event.id);
                    return {
                        id: event._id || event.id,
                        title: event.title,
                        date: event.date, // Already in DD-MM-YYYY format from events.json
                        time: event.time || 'Time TBD',
                        location: event.location || 'Location TBD',
                        description: event.description,
                        image: event.image,
                        website: event.website,
                        source: 'events.json'
                    };
                });
                
                this.displayEvents(formattedEvents);
            } else {
                this.showMessage('Failed to load events from backend', 'error');
            }
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

        // Sort events: upcoming events first (chronologically), then past events (reverse chronologically)
        const sortedEvents = events.sort((a, b) => {
            const dateA = this.parseEventDate(a.date);
            const dateB = this.parseEventDate(b.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const isUpcomingA = dateA >= today;
            const isUpcomingB = dateB >= today;

            // If both are upcoming or both are past, sort by date first
            if (isUpcomingA === isUpcomingB) {
                if (isUpcomingA) {
                    // Both upcoming: earliest date first
                    const dateDiff = dateA - dateB;
                    if (dateDiff === 0) {
                        // Same date: sort by start time
                        return this.compareEventTimes(a.time, b.time);
                    }
                    return dateDiff;
                } else {
                    // Both past: most recent date first
                    const dateDiff = dateB - dateA;
                    if (dateDiff === 0) {
                        // Same date: sort by start time
                        return this.compareEventTimes(a.time, b.time);
                    }
                    return dateDiff;
                }
            }
            
            // Upcoming events come before past events
            return isUpcomingA ? -1 : 1;
        });

        sortedEvents.forEach(event => {
            console.log('Displaying event:', event.title, 'ID:', event.id);
            const isUpcoming = this.isEventUpcoming(event.date);
            const row = document.createElement('tr');

            row.innerHTML = `
                <td class="event-title">${event.title}</td>
                <td class="event-date">${this.formatDate(event.date)}</td>
                <td class="event-time">${event.time || 'Time TBD'}</td>
                <td class="event-location">${event.location || 'N/A'}</td>
                <td class="event-status">
                    <span class="status-badge ${isUpcoming ? 'status-upcoming' : 'status-past'}">
                        ${isUpcoming ? 'Upcoming' : 'Past'}
                    </span>
                </td>
                <td class="event-actions">
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="adminDashboard.editEvent('${event.id}')" title="Edit Event">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="adminDashboard.deleteEvent('${event.id}')" title="Delete Event">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    async editEvent(eventId) {
        try {
            // Store event ID for update FIRST (before showing form)
            this.editingEventId = eventId;
            
            // Get event details
            const response = await fetch(`${this.apiBaseUrl}/event/${eventId}`);
            if (!response.ok) {
                this.showMessage('Failed to load event details', 'error');
                this.editingEventId = null; // Reset on error
                return;
            }

            const event = await response.json();
            
            // Show form first (now that editingEventId is set, it won't reset)
            this.toggleEventForm(true, 'Edit Event');
            
            // Then populate form with existing data
            document.getElementById('event-title').value = event.title;
            document.getElementById('event-date').value = this.convertDateForInput(event.date);
            document.getElementById('event-time').value = this.extractStartTime(event.time);
            document.getElementById('event-end-time').value = this.extractEndTime(event.time);
            document.getElementById('event-location').value = event.location || '';
            document.getElementById('event-image').value = event.image || '';
            document.getElementById('event-website').value = event.website || '';
            document.getElementById('event-description').value = event.description || '';

            // Change button text
            document.querySelector('#event-form button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Update Event';
            
        } catch (error) {
            console.error('Error loading event for edit:', error);
            this.showMessage('Failed to load event details', 'error');
            this.editingEventId = null; // Reset on error
        }
    }

    async deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) {
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/event/delete/${eventId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showMessage('Event deleted successfully!', 'success');
                this.loadEvents();
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to delete event', 'error');
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
        if (await this.checkAuthentication()) {
            this.loadEvents();
            this.loadAnalytics();
        }
    }

    parseEventDate(dateString) {
        // Convert DD-MM-YYYY to Date object
        const [day, month, year] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    parseEventTime(timeString) {
        // Extract start time from "9:00am - 4:00pm" or "9:00am" format
        if (!timeString || timeString === 'Time TBD') return null;
        
        const startTime = timeString.split(' - ')[0].trim();
        return this.convertTimeToMinutes(startTime);
    }

    convertTimeToMinutes(timeStr) {
        // Convert "9:00am" to minutes since midnight for comparison
        if (!timeStr) return 0;
        
        const match = timeStr.match(/(\d{1,2}):(\d{2})(am|pm)/i);
        if (!match) return 0;
        
        let [, hours, minutes, period] = match;
        hours = parseInt(hours);
        minutes = parseInt(minutes);
        
        if (period.toLowerCase() === 'pm' && hours !== 12) {
            hours += 12;
        } else if (period.toLowerCase() === 'am' && hours === 12) {
            hours = 0;
        }
        
        return hours * 60 + minutes;
    }

    compareEventTimes(timeA, timeB) {
        // Compare two event times for sorting
        const minutesA = this.parseEventTime(timeA);
        const minutesB = this.parseEventTime(timeB);
        
        if (minutesA === null && minutesB === null) return 0;
        if (minutesA === null) return 1; // Put "Time TBD" at the end
        if (minutesB === null) return -1;
        
        return minutesA - minutesB; // Earlier times first
    }

    isEventUpcoming(dateString) {
        const eventDate = this.parseEventDate(dateString);
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

    formatDateForAdmin(dateString) {
        if (!dateString) return 'No date';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';
        
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

    async addToLocalEvents(eventData) {
        try {
            // Format the event for events.json
            const formattedEvent = {
                title: eventData.title,
                date: this.formatDateForEventsJson(eventData.date),
                time: this.formatTimeRange(eventData.time, eventData.endTime),
                location: eventData.location || 'Location TBD',
                description: eventData.description,
                image: eventData.image || 'https://via.placeholder.com/400x200?text=Event+Image',
                website: eventData.website || '#'
            };

            // Get existing events from events.json
            const response = await fetch('../../events.json');
            const existingEvents = response.ok ? await response.json() : [];

            // Add new event to the beginning
            existingEvents.unshift(formattedEvent);

            // Create downloadable JSON file
            const blob = new Blob([JSON.stringify(existingEvents, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = 'events.json';
            a.style.display = 'none';
            document.body.appendChild(a);
            
            // Show message to user
            this.showMessage('Event added! Click here to download updated events.json', 'success');
            
            // Auto-download after 2 seconds
            setTimeout(() => {
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 2000);

        } catch (error) {
            console.error('Error creating local events file:', error);
        }
    }

    formatDateForEventsJson(dateString) {
        // Convert YYYY-MM-DD to DD-MM-YYYY
        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
    }

    formatTimeRange(startTime, endTime) {
        if (!startTime) return 'Time TBD';
        
        let formatted = this.formatTimeDisplay(startTime);
        if (endTime) {
            formatted += ` - ${this.formatTimeDisplay(endTime)}`;
        }
        return formatted;
    }

    formatTimeDisplay(timeString) {
        if (!timeString) return 'Time TBD';
        
        try {
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours);
            const min = minutes || '00';
            
            if (hour === 0) return `12:${min}am`;
            if (hour < 12) return `${hour}:${min}am`;
            if (hour === 12) return `12:${min}pm`;
            return `${hour - 12}:${min}pm`;
        } catch (error) {
            return timeString;
        }
    }

    // Helper functions for edit functionality
    convertDateForInput(dateString) {
        // Convert DD-MM-YYYY to YYYY-MM-DD for input field
        if (!dateString) return '';
        const [day, month, year] = dateString.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    extractStartTime(timeString) {
        // Extract start time from "10:00am - 4:30pm" format
        if (!timeString || timeString === 'Time TBD') return '';
        
        const parts = timeString.split(' - ');
        if (parts.length > 0) {
            return this.convertTo24Hour(parts[0].trim());
        }
        return this.convertTo24Hour(timeString);
    }

    extractEndTime(timeString) {
        // Extract end time from "10:00am - 4:30pm" format
        if (!timeString || timeString === 'Time TBD') return '';
        
        const parts = timeString.split(' - ');
        if (parts.length > 1) {
            return this.convertTo24Hour(parts[1].trim());
        }
        return '';
    }

    convertTo24Hour(timeStr) {
        // Convert "10:00am" to "10:00" (24-hour format)
        if (!timeStr) return '';
        
        const match = timeStr.match(/(\d{1,2}):(\d{2})(am|pm)/i);
        if (!match) return timeStr;
        
        let [, hours, minutes, period] = match;
        hours = parseInt(hours);
        
        if (period.toLowerCase() === 'pm' && hours !== 12) {
            hours += 12;
        } else if (period.toLowerCase() === 'am' && hours === 12) {
            hours = 0;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    toggleEventForm(show, title = 'Add New Event') {
        const modal = document.getElementById('event-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.querySelector('.modal-body');
        
        if (show) {
            modal.classList.remove('hidden');
            modalTitle.textContent = title;
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            
            // Reset modal scroll position to top
            if (modalBody) {
                modalBody.scrollTop = 0;
            }
            
            // Small delay to ensure modal is visible before focusing
            setTimeout(() => {
                const firstInput = document.getElementById('event-title');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
            
            if (!this.editingEventId) {
                document.getElementById('event-form').reset();
                document.querySelector('#event-form button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Save Event';
            }
        } else {
            modal.classList.add('hidden');
            document.body.style.overflow = ''; // Restore scrolling
            this.editingEventId = null;
            document.querySelector('#event-form button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Save Event';
            modalTitle.textContent = 'Add New Event';
        }
    }

    setupTextCleaning() {
        // List of form fields to clean
        const fieldsToClean = [
            'event-title',
            'event-location', 
            'event-image',
            'event-website',
            'event-description'
        ];

        fieldsToClean.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                // Clean on paste
                field.addEventListener('paste', (e) => {
                    setTimeout(() => {
                        field.value = this.cleanInvisibleCharacters(field.value);
                    }, 10);
                });

                // Clean on blur (when user leaves the field)
                field.addEventListener('blur', (e) => {
                    field.value = this.cleanInvisibleCharacters(field.value);
                });
            }
        });
    }

    cleanInvisibleCharacters(text) {
        if (!text) return text;
        
        // Remove common invisible/problematic characters
        return text
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero width spaces
            .replace(/[\u00A0]/g, ' ')             // Non-breaking spaces to regular spaces
            .replace(/[\u2000-\u200A]/g, ' ')      // Various space characters
            .replace(/[\u2028\u2029]/g, '\n')      // Line/paragraph separators
            .replace(/[\u202A-\u202E]/g, '')       // Text direction marks
            .trim();                               // Remove leading/trailing whitespace
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