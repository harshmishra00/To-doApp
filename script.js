// --- State ---
let tasks = [];
let currentFilter = 'all'; // 'all', 'active', 'completed'
let searchQuery = '';

// --- DOM Elements ---
const taskForm = document.getElementById('taskForm');
const taskTitleInput = document.getElementById('taskTitle');
const taskDescInput = document.getElementById('taskDesc');
const titleError = document.getElementById('titleError');
const taskListElement = document.getElementById('taskList');
const emptyMessage = document.getElementById('emptyMessage');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const themeToggleBtn = document.getElementById('themeToggle');

// --- Initialization ---
function init() {
    loadTheme();
    loadTasks();
    renderTasks();
    setupEventListeners();
}

// --- Event Listeners ---
function setupEventListeners() {
    // Add task form submission
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTask();
    });

    // Clear error on input
    taskTitleInput.addEventListener('input', () => {
        if (taskTitleInput.value.trim() !== '') {
            taskTitleInput.parentElement.classList.remove('error');
        }
    });

    // Search input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderTasks();
    });

    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active styling
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update filter state and render
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // Theme toggle
    themeToggleBtn.addEventListener('click', toggleTheme);
}

// --- Task Management ---
function addTask() {
    const title = taskTitleInput.value.trim();
    const desc = taskDescInput.value.trim();

    if (!validateForm(title)) {
        return;
    }

    const newTask = {
        id: generateId(),
        title: title,
        description: desc,
        completed: false,
        createdAt: new Date().getTime()
    };

    tasks.unshift(newTask); // Add to beginning of array
    saveTasks();
    
    // Clear form
    taskForm.reset();
    
    // If filter is 'completed', switch to 'all' to see the new task
    if (currentFilter === 'completed') {
        document.querySelector('[data-filter="all"]').click();
    } else {
        renderTasks();
    }
}

function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }
}

// Attach functions to window so inline onclick handlers in HTML string work properly
window.toggleTask = function(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    
    saveTasks();
    renderTasks();
}

window.deleteTask = function(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }
}


// --- Validation ---
function validateForm(title) {
    if (title === '') {
        taskTitleInput.parentElement.classList.add('error');
        return false;
    }
    return true;
}

function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// --- LocalStorage ---
function saveTasks() {
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem('todoTasks');
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
        } catch (e) {
            console.error('Error parsing tasks from LocalStorage', e);
            tasks = [];
        }
    }
}

// --- Rendering ---
function renderTasks() {
    // 1. Filter by status
    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    }

    // 2. Filter by search query
    if (searchQuery !== '') {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(searchQuery) || 
            (task.description && task.description.toLowerCase().includes(searchQuery))
        );
    }

    // 3. Render UI
    taskListElement.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        taskListElement.classList.add('hidden');
        emptyMessage.classList.remove('hidden');
    } else {
        taskListElement.classList.remove('hidden');
        emptyMessage.classList.add('hidden');
        
        filteredTasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = `task-card ${task.completed ? 'completed' : ''}`;
            
            const statusText = task.completed ? '✓ Completed' : '○ Active';
            const toggleText = task.completed ? 'Mark Incomplete' : 'Complete Task';
            
            taskCard.innerHTML = `
                <div class="task-header">
                    <div class="task-info">
                        <h3 class="task-title">${escapeHTML(task.title)}</h3>
                        ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}
                    </div>
                </div>
                <div class="task-header" style="align-items: flex-end; margin-top: 0.5rem;">
                    <div class="task-status ${task.completed ? 'is-completed' : ''}">
                        ${statusText}
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-sm btn-success" onclick="toggleTask('${task.id}')">
                            ${toggleText}
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTask('${task.id}')">
                            Delete
                        </button>
                    </div>
                </div>
            `;
            
            taskListElement.appendChild(taskCard);
        });
    }
}

// Security: escape HTML to prevent XSS
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// --- Theme Management ---
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    setTheme(newTheme);
}

function setTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.textContent = '☀️ Light Mode';
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeToggleBtn.textContent = '🌙 Dark Mode';
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        setTheme('dark');
    } else {
        setTheme('light');
    }
}

// Start the app
init();
