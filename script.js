// Function to fetch event data
async function fetchEventData() {
    try {
        let eventsJsonPath = 'events.json';
        // Check if we're on the past events page
        if (window.location.pathname.includes('pastevents')) {
            eventsJsonPath = '../../events.json';
        }
        const response = await fetch(eventsJsonPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const events = await response.json();
        populateEventGrids(events);
    } catch (error) {
        console.error('Error fetching event data:', error);
    }
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
        // Parse date in DD-MM-YYYY format
        const [day, month, year] = event.date.split('-').map(Number);
        if (isNaN(day) || isNaN(month) || isNaN(year)) {
            throw new Error('Invalid date format');
        }
        const eventDateObj = new Date(Date.UTC(year, month - 1, day));

        // Check if the date is valid
        if (isNaN(eventDateObj.getTime())) {
            throw new Error('Invalid date');
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
    } catch (error) {
        console.error(`Error formatting date for event "${event.title}":`, error);
        formattedDate = 'Date not available';
    }

    return `
        <div class="${isPastEvent ? 'past-event-card' : 'event-card'}">
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


    // Sort upcoming events by date in ascending order
    upcomingEvents.sort((a, b) => {
        const dateA = new Date(a.date.split('-').reverse().join('-'));
        const dateB = new Date(b.date.split('-').reverse().join('-'));
        return dateA - dateB;
    });

    // Sort past events by date in descending order
    pastEvents.sort((a, b) => {
        const dateA = new Date(a.date.split('-').reverse().join('-'));
        const dateB = new Date(b.date.split('-').reverse().join('-'));
        return dateB - dateA;
    });

    // Populate upcoming events grid
    const upcomingEventGrid = document.getElementById('upcoming-events');
    if (upcomingEventGrid) {
        upcomingEventGrid.innerHTML = upcomingEvents.map(event => createEventCard(event)).join('');
    } else {
        console.log('Upcoming events grid not found');
    }

    // Populate past events grid
    const pastEventGrid = document.getElementById('past-events');
    if (pastEventGrid) {
        pastEventGrid.innerHTML = pastEvents.map(event => createEventCard(event, true)).join('');
    } else {
        console.log('Past events grid not found');
    }
    console.log(`Populated ${upcomingEvents.length} upcoming events and ${pastEvents.length} past events.`);
}

// Fetch and display events on DOM load
document.addEventListener('DOMContentLoaded', fetchEventData);

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

// Dark mode toggle
document.getElementById('dark-mode-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

// Mobile menu functionality
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navItems = document.querySelector('.nav-items');

mobileMenuBtn.addEventListener('click', () => {
    navItems.classList.toggle('active');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!navItems.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        navItems.classList.remove('active');
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
document.querySelector('.search-button').addEventListener('click', function() {
    const query = document.querySelector('.search-input').value.toLowerCase();
    const events = document.querySelectorAll('.event-card'); // Ensure this selector matches your event cards

    events.forEach(event => {
        const title = event.querySelector('.event-title').textContent.toLowerCase(); // Ensure this selector matches your event title
        if (title.includes(query)) {
            event.style.display = 'block'; // Show matching event
        } else {
            event.style.display = 'none'; // Hide non-matching event
        }
    });
});