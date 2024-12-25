// Constants
const API_BASE_URL = 'http://localhost:5501/api';
const isDebugMode = true; // Set to false in production

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Display username
    const usernameDisplay = document.getElementById('username-display');
    const username = localStorage.getItem('username');
    if (username && usernameDisplay) {
        usernameDisplay.textContent = `Welcome, ${username}!`;
    }

    // Load dashboard data
    loadDashboardData();
});

// Logout handler
document.getElementById('logout-btn').addEventListener('click', function () {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
});

// Add authentication headers to all fetch requests
function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    if (isDebugMode) console.log('Token:', token);

    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
}

// Load all dashboard data
async function loadDashboardData() {
    try {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.style.display = 'block';

        if (isDebugMode) console.log('Fetching dashboard data...');
        const response = await authenticatedFetch(`${API_BASE_URL}/dashboard`);
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                alert('Session expired. Please log in again.');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new TypeError("Oops, we haven't got JSON!");
        }

        const data = await response.json();
        if (isDebugMode) console.log('Dashboard data:', data);

        if (!data || !data.success) {
            throw new Error('No data received from server or request failed');
        }

        const dashboardData = data.data;
        updateSummaryCards(dashboardData);
        createPriorityChart(dashboardData.priorityDistribution);
        createTimelineChart(dashboardData.tasksOverTime);
        updateRecentActivity(dashboardData.recentTasks);

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        clearCharts();
    } finally {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

// Clear existing charts
function clearCharts() {
    ['priority-chart', 'tasks-timeline'].forEach(id => {
        const chart = Chart.getChart(id);
        if (chart) chart.destroy();
    });
}

// Update summary cards with current statistics
function updateSummaryCards(data) {
    if (!data) return;

    document.getElementById('total-tasks').textContent = data.totalTasks || 0;
    document.getElementById('completed-tasks').textContent = data.completedTasks || 0;
    document.getElementById('pending-tasks').textContent = data.pendingTasks || 0;
    document.getElementById('high-priority-tasks').textContent = data.highPriorityTasks || 0;
}

// Create the priority distribution pie chart
function createPriorityChart(data) {
    if (!data) return;

    const ctx = document.getElementById('priority-chart').getContext('2d');
    clearCharts();

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Not Important', 'Important', 'Very Important'],
            datasets: [{
                data: [
                    data.notImportant || 0,
                    data.important || 0,
                    data.veryImportant || 0
                ],
                backgroundColor: ['#198754', '#ffc107', '#dc3545'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Create the tasks timeline chart
function createTimelineChart(data) {
    if (!data || !data.dates || !data.counts) return;

    const ctx = document.getElementById('tasks-timeline').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [{
                label: 'Tasks Created',
                data: data.counts,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Update the recent activity table
function updateRecentActivity(tasks) {
    if (!Array.isArray(tasks)) return;

    const tbody = document.getElementById('recent-tasks');
    tbody.innerHTML = '';

    tasks.forEach(task => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${task.name || ''}</td>
            <td>${getPriorityBadge(task.priority || 'not-important')}</td>
            <td>${getStatusBadge(task.completed || false)}</td>
            <td><i class="bi bi-calendar-event text-muted me-1"></i>${task.date_added || 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
}

// Helper function to generate priority badges
function getPriorityBadge(priority) {
    const priorityClass = (priority || '').replace(/\s+/g, '-').toLowerCase();
    const priorityColors = {
        'very-important': 'danger',
        'important': 'warning',
        'not-important': 'success'
    };
    return `<span class="badge bg-${priorityColors[priorityClass] || 'secondary'} rounded-pill" aria-label="${priority || 'Unknown'}">${priority || 'Unknown'}</span>`;
}

// Helper function to generate status badges
function getStatusBadge(completed) {
    return completed
        ? '<span class="badge bg-success status-badge" aria-label="Completed"><i class="bi bi-check-circle me-1"></i>Completed</span>'
        : '<span class="badge bg-warning status-badge" aria-label="Pending"><i class="bi bi-clock me-1"></i>Pending</span>';
}
