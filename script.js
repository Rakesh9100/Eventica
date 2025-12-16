console.log('🔄 Script.js loaded at', new Date().toISOString(), '- Version 2.0');

// Function to fetch event data
async function fetchEventData() {
    console.log('🚀 fetchEventData called - Script updated at', new Date().toISOString());
    try {
        let eventsSource;

        // Try to fetch from backend API first
        try {
            const apiUrl = API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.EVENTS;
            console.log('🔗 Fetching from API URL:', apiUrl);
            const apiResponse = await fetch(apiUrl);

            if (apiResponse.ok) {
                const apiEvents = await apiResponse.json();
                console.log('✅ Successfully fetched', apiEvents.length, 'events from backend API');
                console.log('📅 Sample event dates from backend:', apiEvents.slice(0, 3).map(e => ({ title: e.title, date: e.date })));
                
                // Convert backend events to frontend format
                eventsSource = apiEvents.map(event => {
                    return {
                        title: event.title,
                        date: event.date, // Use date field directly from backend (DD-MM-YYYY format)
                        time: event.time || 'Time TBD',
                        location: event.location || 'Location TBD',
                        description: event.description,
                        image: event.image || 'https://via.placeholder.com/400x200?text=Event+Image',
                        website: event.website || '#'
                    };
                });
                console.log('✅ Processed', eventsSource.length, 'events for frontend');
                console.log('📅 Sample processed dates:', eventsSource.slice(0, 3).map(e => ({ title: e.title, date: e.date })));
            } else {
                throw new Error(`Backend API returned ${apiResponse.status}: ${apiResponse.statusText}`);
            }
        } catch (apiError) {
            console.log('❌ Backend API error:', apiError.message);
            console.log('🔄 Falling back to local events.json');

            // Fallback to local events.json
            let eventsJsonPath = 'events.json';
            if (window.location.pathname.includes('pastevents')) {
                eventsJsonPath = '../../events.json';
            }
            console.log('📁 Loading local events.json from:', eventsJsonPath);
            const response = await fetch(eventsJsonPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            eventsSource = await response.json();
            console.log('✅ Loaded', eventsSource.length, 'events from local events.json');
            console.log('📅 Sample local event dates:', eventsSource.slice(0, 3).map(e => ({ title: e.title, date: e.date })));
        }

        populateEventGrids(eventsSource);
	} catch (error) {
        console.error('Error fetching event data:', error);
		showErrorMessage('Failed to load events. Please try again later.');
    }
}

// Helper function to format date from backend
function formatDateFromBackend(dateString) {
    if (!dateString) {
        const today = new Date();
        const day = today.getDate().toString().padStart(2, '0');
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const year = today.getFullYear();
        return `${day}-${month}-${year}`;
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return formatDateFromBackend(null); // fallback to today
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
}

// Helper function to format time (24hr to 12hr with am/pm)
function formatTime(timeString) {
    if (!timeString || timeString === 'Time TBD') return timeString;
    
    try {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const min = minutes || '00';
        
        if (hour === 0) return `12:${min}am`;
        if (hour < 12) return `${hour}:${min}am`;
        if (hour === 12) return `12:${min}pm`;
        return `${hour - 12}:${min}pm`;
    } catch (error) {
        return timeString; // Return original if parsing fails
    }
}

// Helper function to show error messages
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 1rem;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Helper functions for time-based sorting
function parseEventTime(timeString) {
    // Extract start time from "9:00am - 4:00pm" or "9:00am" format
    if (!timeString || timeString === 'Time TBD') return null;
    
    const startTime = timeString.split(' - ')[0].trim();
    return convertTimeToMinutes(startTime);
}

function convertTimeToMinutes(timeStr) {
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

function compareEventTimes(timeA, timeB) {
    // Compare two event times for sorting
    const minutesA = parseEventTime(timeA);
    const minutesB = parseEventTime(timeB);
    
    if (minutesA === null && minutesB === null) return 0;
    if (minutesA === null) return 1; // Put "Time TBD" at the end
    if (minutesB === null) return -1;
    
    return minutesA - minutesB; // Earlier times first
}

// Function to check if an event is in the past
function isEventPast(eventDate) {
    const [day, month, year] = eventDate.split('-').map(Number);
    const eventDateObj = new Date(Date.UTC(year, month - 1, day)); // Months are 0-based
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())); // Normalize to UTC
    return eventDateObj < todayUTC;
}

// Function to create event cards
function createEventCard(event, isPastEvent = false) {
    const buttonText = isPastEvent ? 'View Details' : 'Register';
    const buttonClass = isPastEvent ? 'gallery-button' : 'register-button';

    let formattedDate = 'Invalid Date';

    try {
        console.log(`🗓️ createEventCard: Processing "${event.title}" with date: "${event.date}"`);
        
        // Ensure we have a valid date string
        if (!event.date || typeof event.date !== 'string') {
            throw new Error(`Invalid date value: ${event.date}`);
        }
        
        // Parse date in DD-MM-YYYY format
        const dateParts = event.date.split('-');
        if (dateParts.length !== 3) {
            throw new Error(`Invalid date format: ${event.date} (expected DD-MM-YYYY)`);
        }
        
        const [day, month, year] = dateParts.map(Number);
        console.log(`🗓️ Parsed date parts: day=${day}, month=${month}, year=${year}`);
        
        if (isNaN(day) || isNaN(month) || isNaN(year)) {
            throw new Error(`Invalid date numbers: day=${day}, month=${month}, year=${year}`);
        }
        
        if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 3000) {
            throw new Error(`Date values out of range: day=${day}, month=${month}, year=${year}`);
        }
        
        const eventDateObj = new Date(Date.UTC(year, month - 1, day));
        console.log(`🗓️ Created date object: ${eventDateObj}`);

        // Check if the date is valid
        if (isNaN(eventDateObj.getTime())) {
            throw new Error('Invalid date object created');
        }

        // Get the components for the desired format
        const weekday = new Intl.DateTimeFormat('en-US', {
            weekday: 'long'
        }).format(eventDateObj);
        const dayNum = eventDateObj.getUTCDate();
        const monthName = new Intl.DateTimeFormat('en-US', {
            month: 'long'
        }).format(eventDateObj);
        const yearNum = eventDateObj.getUTCFullYear();

        // Combine components into the desired format
        formattedDate = `${dayNum} ${monthName} ${yearNum}, ${weekday}`;
        console.log(`🗓️ Final formatted date: ${formattedDate}`);
    } catch (error) {
        console.error(`❌ Error formatting date for event "${event.title}":`, error);
        console.error(`❌ Original date value:`, event.date, typeof event.date);
        formattedDate = `Date error: ${event.date}`;
    }

    return `
        <div class="${isPastEvent ? 'past-event-card' : 'event-card'}">
            <div class="event-background">
                <img src="${event.image}" alt="Background" class="blurred-image">
            </div>
            <a href="${event.website || '#'}" target="_blank" rel="noopener noreferrer" class="${isPastEvent ? 'past-card-link' : 'card-link'}">
                <img src="${event.image}" alt="${event.title}" class="${isPastEvent ? 'past-event-image' : 'event-image'}">
                <div class="${isPastEvent ? 'past-event-details' : 'event-details'}">
                    <h3 class="${isPastEvent ? 'past-event-title' : 'event-title'}">${event.title}</h3>
                    <p class="${isPastEvent ? 'past-event-date' : 'event-date'}">${formattedDate}</p>
                    <p class="${isPastEvent ? 'past-event-time' : 'event-time'}">${event.time || 'Time not specified'}</p>
                    <p class="${isPastEvent ? 'past-event-location' : 'event-location'}">${event.location || 'Location not specified'}</p>
                    <p class="${isPastEvent ? 'past-event-description' : 'event-description'}">${event.description || 'No description available'}</p>
                    <a href="${event.website || '#'}" target="_blank" rel="noopener noreferrer" class="${buttonClass}">${buttonText}</a>
                </div>
            </a>
        </div>
    `;
}

// Function to populate event grids
function populateEventGrids(events) {
    // Filter past and upcoming events using isEventPast function
    const upcomingEvents = events.filter(event => !isEventPast(event.date));
    const pastEvents = events.filter(event => isEventPast(event.date));


    // Sort upcoming events by date in ascending order, then by time
    upcomingEvents.sort((a, b) => {
        const dateA = new Date(a.date.split('-').reverse().join('-'));
        const dateB = new Date(b.date.split('-').reverse().join('-'));
        
        // First sort by date
        const dateDiff = dateA - dateB;
        if (dateDiff !== 0) {
            return dateDiff;
        }
        
        // If same date, sort by start time
        return compareEventTimes(a.time, b.time);
    });

    // Sort past events by date in descending order, then by time
    pastEvents.sort((a, b) => {
        const dateA = new Date(a.date.split('-').reverse().join('-'));
        const dateB = new Date(b.date.split('-').reverse().join('-'));
        
        // First sort by date (descending)
        const dateDiff = dateB - dateA;
        if (dateDiff !== 0) {
            return dateDiff;
        }
        
        // If same date, sort by start time
        return compareEventTimes(a.time, b.time);
    });

    // Populate upcoming events grid
    const upcomingEventGrid = document.getElementById('upcoming-events');
    if (upcomingEventGrid) {
        upcomingEventGrid.innerHTML = upcomingEvents.map(event => createEventCard(event)).join('');
    }

    // Populate past events grid
    const pastEventGrid = document.getElementById('past-events');
    if (pastEventGrid) {
        pastEventGrid.innerHTML = pastEvents.map(event => createEventCard(event, true)).join('');
    }
    // console.log(`Populated ${upcomingEvents.length} upcoming events and ${pastEvents.length} past events.`);
}

// Fetch and display events on DOM load if on the relevant page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.includes('pastevents')) {
        fetchEventData();
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Navbar background change on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    } else {
        navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    }
});

// Theme switcher functionality
document.addEventListener('DOMContentLoaded', function () {
    const themeToggle = document.getElementById('theme-toggle');
    const themeOptions = document.querySelector('.theme-options');
    const themeButtons = document.querySelectorAll('.theme-btn');
    const logoImage = document.querySelector('.logo'); // Logo image element
    const savedTheme = localStorage.getItem('theme');

    const themeAssets = {
        blue: {
            logo: '/assets/images/logos/logo1.png',
            favicon: '/assets/images/favicons/favicon1.png'
        },
        red: {
            logo: '/assets/images/logos/logo2.png',
            favicon: '/assets/images/favicons/favicon2.png'
        },
        yellow: {
            logo: '/assets/images/logos/logo3.png',
            favicon: '/assets/images/favicons/favicon3.png'
        },
        green: {
            logo: '/assets/images/logos/logo4.png',
            favicon: '/assets/images/favicons/favicon4.png'
        },
        purple: {
            logo: '/assets/images/logos/logo5.png',
            favicon: '/assets/images/favicons/favicon5.png'
        },
    };

    const updateFavicon = (faviconPath) => {
        let faviconElement = document.querySelector("link[rel='icon']");
        if (!faviconElement) {
            faviconElement = document.createElement('link');
            faviconElement.rel = 'icon';
            faviconElement.type = 'image/x-icon';
            document.head.appendChild(faviconElement);
        }
        faviconElement.href = faviconPath;
    };

    // Set initial theme, logo, and favicon based on localStorage
    if (savedTheme && themeAssets[savedTheme]) {
        const {
            logo,
            favicon
        } = themeAssets[savedTheme];
        document.documentElement.setAttribute('data-theme', savedTheme);
        logoImage.src = logo;
        updateFavicon(favicon);
    }

    themeToggle.addEventListener('click', function () {
        themeOptions.classList.toggle('active');
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !isExpanded);
    });

    themeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const color = this.getAttribute('data-color');
            if (themeAssets[color]) {
                const {
                    logo,
                    favicon
                } = themeAssets[color];
                document.documentElement.setAttribute('data-theme', color);
                localStorage.setItem('theme', color);
                logoImage.src = logo;
                updateFavicon(favicon);
                themeOptions.classList.remove('active');
                themeToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Close theme options when clicking outside
    document.addEventListener('click', function (event) {
        if (!themeToggle.contains(event.target) && !themeOptions.contains(event.target)) {
            themeOptions.classList.remove('active');
            themeToggle.setAttribute('aria-expanded', 'false');
        }
    });
});

// Dark mode toggle based on preference
function applyDarkModePreference() {
    const darkModeStatus = localStorage.getItem('darkMode');
    if (darkModeStatus === 'enabled') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// Immediately apply the stored dark mode preference
applyDarkModePreference();

// Toggle dark mode and save the preference
document.getElementById('dark-mode-toggle').addEventListener('click', () => {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
});

// Mobile menu functionality
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navItems = document.querySelector('.nav-items');

mobileMenuBtn.addEventListener('click', () => {
    mobileMenuBtn.classList.toggle('active');
    navItems.classList.toggle('active');

    // Toggle body scrolling for small devices
    if (navItems.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }

    // Update accessibility attributes
    const isOpen = navItems.classList.contains('active');
    mobileMenuBtn.setAttribute('aria-expanded', isOpen);
    mobileMenuBtn.setAttribute('aria-label', isOpen ? 'Close mobile menu' : 'Open mobile menu');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!navItems.contains(e.target) && !mobileMenuBtn.contains(e.target) && navItems.classList.contains('active')) {
        mobileMenuBtn.classList.remove('active');
        navItems.classList.remove('active');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.setAttribute('aria-label', 'Open mobile menu');
        document.body.style.overflow = 'auto';
    }
});

// Close mobile menu when window is resized
window.addEventListener('resize', () => {
    if (window.innerWidth > 1024 && navItems.classList.contains('active')) {
        mobileMenuBtn.classList.remove('active');
        navItems.classList.remove('active');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.setAttribute('aria-label', 'Open mobile menu');
        document.body.style.overflow = 'auto';
    }
});

// Scroll to top button
document.addEventListener('DOMContentLoaded', () => {
    // Select the scroll-to-top button
    const toTop = document.querySelector(".to-top");

    if (!toTop) {
        console.error('Scroll-to-top element not found.');
        return;
    }

    // Show or hide the button on scroll
    function checkHeight() {
        if (window.scrollY > 100) {
            toTop.classList.add("active");
        } else {
            toTop.classList.remove("active");
        }
    }

    // Debounce the scroll event for performance
    let scrollTimeout;
    window.addEventListener("scroll", () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(checkHeight, 100);
    });

    // Smooth scroll to top on button click
    toTop.addEventListener("click", (e) => {
        e.preventDefault(); // Prevent default anchor behavior
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

// Search bar
const searchButton = document.querySelector('.search-button');
const searchInput = document.querySelector('.search-input');

if (searchButton && searchInput) {
    const handleSearch = () => {
        const query = searchInput.value.toLowerCase();
        let events;

        // Determine which page we are on and select the appropriate event cards
        if (window.location.pathname.includes('pastevents')) {
            events = document.querySelectorAll('.past-event-card');
        } else {
            events = document.querySelectorAll('.event-card');
        }

        events.forEach(event => {
            const title = event.querySelector('.event-title, .past-event-title').textContent.toLowerCase();
            const description = event.querySelector('.event-description, .past-event-description').textContent.toLowerCase();
            if (query === '' || title.includes(query) || description.includes(query)) {
                event.style.display = 'block'; // Show matching event or all events if query is empty
            } else {
                event.style.display = 'none'; // Hide non-matching event
            }
        });
    };

    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('input', handleSearch);
}

// Testimonials expansion functionality
document.addEventListener("DOMContentLoaded", () => {
    const seeMoreBtn = document.getElementById("see-more-btn");
    const extraTestimonials = document.querySelector(".extra-testimonials");

    if (seeMoreBtn && extraTestimonials) {
        seeMoreBtn.addEventListener("click", () => {
            // Toggle the "hidden" class
            extraTestimonials.classList.toggle("hidden");

            // Update button text and icon
            if (extraTestimonials.classList.contains("hidden")) {
                seeMoreBtn.innerHTML = 'See More <i class="fas fa-chevron-down"></i>';
            } else {
                seeMoreBtn.innerHTML = 'See Less <i class="fas fa-chevron-up"></i>';
            }
        });
    }
});