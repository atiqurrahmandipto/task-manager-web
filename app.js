/**
 * TaskFlow — Modern Responsive Task Manager
 * Complete Application Logic
 * 
 * Features:
 * - Theme controller (Dark / Light mode toggle with persistence)
 * - Full CRUD Operations with LocalStorage sync
 * - Multi-criteria live filtering (Status, Priority, Category, Search)
 * - Sorting algorithms (Custom Drag Order, Due Date, Priority, Date Created)
 * - Drag-and-Drop task reordering (HTML5 DND + Touch gesture support)
 * - Due date calculations & smart overdue badges
 * - Native <dialog> modal controller with light-dismiss
 * - Canvas confetti celebration & custom toast notifications
 * - Keyboard shortcuts (N: New task, /: Search, Esc: Close modal)
 */

'use strict';

/* ==========================================================================
   1. State Management & Initial Sample Data
   ========================================================================== */
const STORAGE_KEYS = {
  TASKS: 'taskflow_tasks_v2',
  THEME: 'taskflow_theme_v1',
  SORT: 'taskflow_sort_v1',
  CATEGORY: 'taskflow_category_v1'
};

// Initial default sample tasks for new users (Banglish daily life tasks)
const SAMPLE_TASKS = [
  {
    id: 'task-1',
    title: 'Bikaler moddhe bashar bazar kora',
    description: 'Dim, dudh, shobji ar chaer pata kinte hobe local bazar theke.',
    dueDate: new Date().toISOString().split('T')[0], // Today
    dueTime: '18:00',
    priority: 'high',
    category: 'Personal',
    completed: false,
    createdAt: Date.now() - 3600000 * 4,
    order: 0
  },
  {
    id: 'task-2',
    title: 'Current bill & Wifi bill pay kora',
    description: 'bKash ba Nagad diye eimash er electricity ar internet bill clear kora.',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    dueTime: '15:00',
    priority: 'medium',
    category: 'Finance',
    completed: false,
    createdAt: Date.now() - 3600000 * 12,
    order: 1
  },
  {
    id: 'task-3',
    title: 'Sokale 30 min jogging & exercise kora',
    description: 'Sokal 6:30 tay uthe park e jogging kora ar stretch kora.',
    dueDate: new Date().toISOString().split('T')[0], // Today
    dueTime: '07:00',
    priority: 'low',
    category: 'Health',
    completed: true,
    createdAt: Date.now() - 3600000 * 20,
    order: 2
  }
];

// App State Container
const state = {
  tasks: [],
  currentFilter: 'all',          // 'all' | 'pending' | 'completed'
  currentPriorityFilter: 'all',  // 'all' | 'high' | 'medium' | 'low'
  currentCategoryFilter: 'all',  // 'all' | 'Work' | 'Personal' | 'Study' | etc.
  searchQuery: '',
  sortBy: 'manual',             // 'manual' | 'dueDate' | 'priority' | 'newest' | 'alphabetical'
  theme: 'dark',
  editingTaskId: null,
  deletingTaskId: null,
  draggedTaskId: null
};

/* ==========================================================================
   2. DOM Element Selectors
   ========================================================================== */
const DOM = {
  html: document.documentElement,
  currentDateText: document.getElementById('currentDateText'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  
  // Stats
  statTotal: document.getElementById('statTotal'),
  statPending: document.getElementById('statPending'),
  statCompleted: document.getElementById('statCompleted'),
  statOverdue: document.getElementById('statOverdue'),
  progressBar: document.getElementById('progressBar'),
  progressPercentage: document.getElementById('progressPercentage'),
  progressSubtext: document.getElementById('progressSubtext'),
  
  // Quick Add
  quickAddForm: document.getElementById('quickAddForm'),
  quickAddInput: document.getElementById('quickAddInput'),
  quickAddDueDate: document.getElementById('quickAddDueDate'),
  quickAddPriority: document.getElementById('quickAddPriority'),
  quickAddCategory: document.getElementById('quickAddCategory'),
  
  // Toolbar Filters
  filterTabs: document.querySelectorAll('.filter-tab'),
  badgeAll: document.getElementById('badgeAll'),
  badgePending: document.getElementById('badgePending'),
  badgeCompleted: document.getElementById('badgeCompleted'),
  sortBySelect: document.getElementById('sortBySelect'),
  priorityFilterSelect: document.getElementById('priorityFilterSelect'),
  categoryPills: document.getElementById('categoryPills'),
  clearCompletedBtn: document.getElementById('clearCompletedBtn'),
  dndHint: document.getElementById('dndHint'),
  
  // Task List
  taskList: document.getElementById('taskList'),
  emptyState: document.getElementById('emptyState'),
  emptyStateTitle: document.getElementById('emptyStateTitle'),
  emptyStateDesc: document.getElementById('emptyStateDesc'),
  emptyStateAddBtn: document.getElementById('emptyStateAddBtn'),
  
  // Modals
  openNewTaskModalBtn: document.getElementById('openNewTaskModalBtn'),
  mobileFab: document.getElementById('mobileFab'),
  taskModal: document.getElementById('taskModal'),
  taskModalTitle: document.getElementById('taskModalTitle'),
  modalHeaderIcon: document.getElementById('modalHeaderIcon'),
  closeTaskModalBtn: document.getElementById('closeTaskModalBtn'),
  cancelTaskModalBtn: document.getElementById('cancelTaskModalBtn'),
  taskForm: document.getElementById('taskForm'),
  taskIdInput: document.getElementById('taskIdInput'),
  taskTitleInput: document.getElementById('taskTitleInput'),
  taskDescInput: document.getElementById('taskDescInput'),
  taskDueDateInput: document.getElementById('taskDueDateInput'),
  taskDueTimeInput: document.getElementById('taskDueTimeInput'),
  taskCategorySelect: document.getElementById('taskCategorySelect'),
  saveTaskBtnText: document.getElementById('saveTaskBtnText'),
  
  // Confirm Delete Modal
  confirmDeleteModal: document.getElementById('confirmDeleteModal'),
  deleteTaskTargetTitle: document.getElementById('deleteTaskTargetTitle'),
  closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),
  cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
  confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
  
  // Feedback
  toastContainer: document.getElementById('toastContainer'),
  confettiCanvas: document.getElementById('confettiCanvas')
};

/* ==========================================================================
   3. Initialization & LocalStorage Management
   ========================================================================== */

/**
 * Initialize TaskFlow Application
 */
function initApp() {
  loadTheme();
  loadSavedData();
  updateLiveDateBadge();
  setupEventListeners();
  renderTasks();
  updateStatistics();
}

/**
 * Load saved tasks and user preferences from LocalStorage
 */
function loadSavedData() {
  try {
    const rawTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (rawTasks) {
      state.tasks = JSON.parse(rawTasks);
      // Ensure all tasks have an order index
      state.tasks.forEach((task, idx) => {
        if (typeof task.order !== 'number') task.order = idx;
      });
    } else {
      // First visit: populate sample tasks
      state.tasks = [...SAMPLE_TASKS];
      saveTasksToStorage();
    }

    const savedSort = localStorage.getItem(STORAGE_KEYS.SORT);
    if (savedSort) {
      state.sortBy = savedSort;
      if (DOM.sortBySelect) DOM.sortBySelect.value = savedSort;
    }

    const savedCategory = localStorage.getItem(STORAGE_KEYS.CATEGORY);
    if (savedCategory) {
      state.currentCategoryFilter = savedCategory;
      updateActiveCategoryPill(savedCategory);
    }
  } catch (err) {
    console.error('Error loading data from localStorage:', err);
    state.tasks = [...SAMPLE_TASKS];
  }
}

/**
 * Save current tasks state to LocalStorage
 */
function saveTasksToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
  } catch (err) {
    console.error('Error saving tasks to localStorage:', err);
    showToast('Failed to save tasks to local storage', 'danger');
  }
}

/* ==========================================================================
   4. Theme Controller (Dark / Light Mode)
   ========================================================================== */

/**
 * Initialize and apply theme
 */
function loadTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  if (savedTheme) {
    state.theme = savedTheme;
  } else {
    // Detect system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    state.theme = prefersDark ? 'dark' : 'light';
  }
  applyTheme(state.theme);
}

/**
 * Apply theme to document
 * @param {'dark'|'light'} theme 
 */
function applyTheme(theme) {
  state.theme = theme;
  DOM.html.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEYS.THEME, theme);

  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#090d16' : '#f8fafc');
  }
}

/**
 * Toggle between Dark and Light mode
 */
function toggleTheme() {
  const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  showToast(`Switched to ${nextTheme.toUpperCase()} mode`, 'info');
}

/* ==========================================================================
   5. Date & Time Utilities
   ========================================================================== */

/**
 * Format today's date for header badge
 */
function updateLiveDateBadge() {
  if (!DOM.currentDateText) return;
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  DOM.currentDateText.textContent = new Intl.DateTimeFormat('en-US', options).format(new Date());
}

/**
 * Calculate due date status badge and friendly display text
 * @param {string} dueDateStr (YYYY-MM-DD)
 * @param {string} dueTimeStr (HH:MM)
 * @param {boolean} isCompleted
 * @returns {{ label: string, statusClass: string, isOverdue: boolean }}
 */
function formatDueDateBadge(dueDateStr, dueTimeStr, isCompleted) {
  if (!dueDateStr) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const [year, month, day] = dueDateStr.split('-').map(Number);
  const taskDate = new Date(year, month - 1, day);

  const diffTime = taskDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let timeFormatted = '';
  if (dueTimeStr) {
    const [hours, mins] = dueTimeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    timeFormatted = ` at ${h12}:${mins} ${ampm}`;
  }

  let label = '';
  let statusClass = 'due-upcoming';
  let isOverdue = false;

  if (diffDays < 0) {
    const pastDays = Math.abs(diffDays);
    label = pastDays === 1 ? `Overdue by 1 day` : `Overdue by ${pastDays} days`;
    statusClass = isCompleted ? 'due-upcoming' : 'due-overdue';
    isOverdue = !isCompleted;
  } else if (diffDays === 0) {
    label = `Due Today${timeFormatted}`;
    statusClass = isCompleted ? 'due-upcoming' : 'due-today';
  } else if (diffDays === 1) {
    label = `Tomorrow${timeFormatted}`;
    statusClass = 'due-upcoming';
  } else if (diffDays <= 7) {
    const dayName = taskDate.toLocaleDateString('en-US', { weekday: 'short' });
    label = `${dayName}${timeFormatted}`;
    statusClass = 'due-upcoming';
  } else {
    const formatted = taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    label = `${formatted}${timeFormatted}`;
    statusClass = 'due-upcoming';
  }

  return { label, statusClass, isOverdue };
}

/* ==========================================================================
   6. Task Filtering, Sorting & Statistics
   ========================================================================== */

/**
 * Get filtered and sorted list of tasks based on current state
 */
function getFilteredAndSortedTasks() {
  let result = [...state.tasks];

  // 1. Status Filter (All, Pending, Completed)
  if (state.currentFilter === 'pending') {
    result = result.filter(t => !t.completed);
  } else if (state.currentFilter === 'completed') {
    result = result.filter(t => t.completed);
  }

  // 2. Priority Filter (All, High, Medium, Low)
  if (state.currentPriorityFilter !== 'all') {
    result = result.filter(t => t.priority === state.currentPriorityFilter);
  }

  // 3. Category Filter
  if (state.currentCategoryFilter !== 'all') {
    result = result.filter(t => t.category === state.currentCategoryFilter);
  }

  // 4. Search Query Filter
  if (state.searchQuery.trim() !== '') {
    const q = state.searchQuery.toLowerCase().trim();
    result = result.filter(t => 
      t.title.toLowerCase().includes(q) || 
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q))
    );
  }

  // 5. Sorting
  switch (state.sortBy) {
    case 'manual':
      result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      break;

    case 'dueDate':
      result.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        const dateA = new Date(`${a.dueDate}T${a.dueTime || '23:59:59'}`).getTime();
        const dateB = new Date(`${b.dueDate}T${b.dueTime || '23:59:59'}`).getTime();
        return dateA - dateB;
      });
      break;

    case 'priority': {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      result.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
      break;
    }

    case 'newest':
      result.sort((a, b) => b.createdAt - a.createdAt);
      break;

    case 'alphabetical':
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;

    default:
      result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  return result;
}

/**
 * Update stats dashboard numbers and progress bar
 */
function updateStatistics() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const pending = total - completed;

  // Calculate overdue tasks
  let overdueCount = 0;
  state.tasks.forEach(t => {
    if (!t.completed && t.dueDate) {
      const badge = formatDueDateBadge(t.dueDate, t.dueTime, t.completed);
      if (badge && badge.isOverdue) overdueCount++;
    }
  });

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Update DOM
  if (DOM.statTotal) DOM.statTotal.textContent = total;
  if (DOM.statPending) DOM.statPending.textContent = pending;
  if (DOM.statCompleted) DOM.statCompleted.textContent = completed;
  if (DOM.statOverdue) DOM.statOverdue.textContent = overdueCount;

  if (DOM.badgeAll) DOM.badgeAll.textContent = total;
  if (DOM.badgePending) DOM.badgePending.textContent = pending;
  if (DOM.badgeCompleted) DOM.badgeCompleted.textContent = completed;

  if (DOM.progressBar) DOM.progressBar.style.width = `${percentage}%`;
  if (DOM.progressPercentage) DOM.progressPercentage.textContent = `${percentage}%`;
  if (DOM.progressSubtext) DOM.progressSubtext.textContent = `${completed} of ${total} tasks completed`;

  // Hide DND hint if sorting is not manual or if filtered
  if (DOM.dndHint) {
    const isFiltered = state.currentFilter !== 'all' || 
                       state.currentPriorityFilter !== 'all' || 
                       state.currentCategoryFilter !== 'all' || 
                       state.searchQuery.trim() !== '';
    if (state.sortBy === 'manual' && !isFiltered && total > 1) {
      DOM.dndHint.style.display = 'flex';
    } else {
      DOM.dndHint.style.display = 'none';
    }
  }
}

/* ==========================================================================
   7. Task Rendering & DOM Generation
   ========================================================================== */

/**
 * Render filtered task list to DOM
 */
function renderTasks() {
  const tasksToRender = getFilteredAndSortedTasks();
  DOM.taskList.innerHTML = '';

  if (tasksToRender.length === 0) {
    DOM.emptyState.style.display = 'flex';
    updateEmptyStateMessage();
    return;
  }

  DOM.emptyState.style.display = 'none';

  tasksToRender.forEach(task => {
    const taskEl = createTaskElement(task);
    DOM.taskList.appendChild(taskEl);
  });
}

/**
 * Create a single Task Item DOM node
 * @param {Object} task 
 * @returns {HTMLElement}
 */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `task-item ${task.completed ? 'completed' : ''}`;
  li.setAttribute('data-id', task.id);
  li.setAttribute('data-priority', task.priority || 'medium');
  li.draggable = state.sortBy === 'manual'; // Only draggable in custom manual sort

  // Due Date Badge calculation
  const dueInfo = formatDueDateBadge(task.dueDate, task.dueTime, task.completed);

  // Category Icon helper
  const categoryIcons = {
    Work: '💼',
    Personal: '🏠',
    Study: '📚',
    Health: '🏃',
    Finance: '💰',
    Other: '📌'
  };
  const categoryIcon = categoryIcons[task.category] || '📌';

  li.innerHTML = `
    <!-- Drag Handle -->
    <div class="task-drag-handle" title="Drag to reorder" aria-label="Drag task">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="12" r="1.5"></circle>
        <circle cx="9" cy="6" r="1.5"></circle>
        <circle cx="9" cy="18" r="1.5"></circle>
        <circle cx="15" cy="12" r="1.5"></circle>
        <circle cx="15" cy="6" r="1.5"></circle>
        <circle cx="15" cy="18" r="1.5"></circle>
      </svg>
    </div>

    <!-- Custom Checkbox -->
    <div class="task-checkbox-wrapper">
      <label class="custom-checkbox" title="${task.completed ? 'Mark as pending' : 'Mark as completed'}">
        <input type="checkbox" class="task-checkbox-input" ${task.completed ? 'checked' : ''} aria-label="Toggle task completion">
        <span class="checkbox-mark">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      </label>
    </div>

    <!-- Task Content -->
    <div class="task-main-content">
      <div class="task-header-row">
        <h3 class="task-title">${escapeHTML(task.title)}</h3>
      </div>
      
      ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}

      <!-- Metadata row (Category, Priority, Due date) -->
      <div class="task-meta-row">
        <span class="task-tag tag-category">
          <span>${categoryIcon}</span>
          <span>${escapeHTML(task.category || 'General')}</span>
        </span>

        <span class="task-tag tag-priority-${task.priority}">
          ${task.priority === 'high' ? '🔥 High' : task.priority === 'medium' ? '⚡ Medium' : '🌱 Low'}
        </span>

        ${dueInfo ? `
          <span class="task-tag tag-due-date ${dueInfo.statusClass}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>${dueInfo.label}</span>
          </span>
        ` : ''}
      </div>
    </div>

    <!-- Action Buttons (Edit, Delete) -->
    <div class="task-actions">
      <button class="task-action-btn btn-edit-task" title="Edit task" aria-label="Edit task">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>

      <button class="task-action-btn btn-delete-task" title="Delete task" aria-label="Delete task">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;

  // Attach Event Listeners to item elements
  const checkbox = li.querySelector('.task-checkbox-input');
  checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));

  const editBtn = li.querySelector('.btn-edit-task');
  editBtn.addEventListener('click', () => openEditTaskModal(task.id));

  const deleteBtn = li.querySelector('.btn-delete-task');
  deleteBtn.addEventListener('click', () => openConfirmDeleteModal(task.id));

  // Drag and drop listeners for this item
  attachDragListeners(li);

  return li;
}

/**
 * Adjust empty state message based on active filter criteria
 */
function updateEmptyStateMessage() {
  if (state.searchQuery.trim() !== '') {
    DOM.emptyStateTitle.textContent = 'No matching tasks found';
    DOM.emptyStateDesc.textContent = `No tasks match your search for "${state.searchQuery}". Try a different keyword or clear the search.`;
  } else if (state.currentFilter === 'completed') {
    DOM.emptyStateTitle.textContent = 'No completed tasks yet';
    DOM.emptyStateDesc.textContent = 'Keep working! Mark pending tasks as complete when you finish them.';
  } else if (state.currentFilter === 'pending') {
    DOM.emptyStateTitle.textContent = 'All tasks completed!';
    DOM.emptyStateDesc.textContent = 'Fantastic job! You have cleared all your pending tasks.';
  } else if (state.currentCategoryFilter !== 'all') {
    DOM.emptyStateTitle.textContent = `No ${state.currentCategoryFilter} tasks`;
    DOM.emptyStateDesc.textContent = `You don't have any tasks categorized under ${state.currentCategoryFilter}.`;
  } else {
    DOM.emptyStateTitle.textContent = 'No tasks in your list';
    DOM.emptyStateDesc.textContent = "You're all caught up! Create a new task above or hit the '+' button to get started.";
  }
}

/**
 * Sanitize HTML strings to prevent XSS
 * @param {string} str 
 * @returns {string}
 */
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ==========================================================================
   8. CRUD Operations
   ========================================================================== */

/**
 * Add a new task to state
 * @param {Object} taskData 
 */
function addTask(taskData) {
  const newTask = {
    id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    title: taskData.title.trim(),
    description: taskData.description ? taskData.description.trim() : '',
    dueDate: taskData.dueDate || '',
    dueTime: taskData.dueTime || '',
    priority: taskData.priority || 'medium',
    category: taskData.category || 'Work',
    completed: false,
    createdAt: Date.now(),
    order: 0 // New tasks inserted at the top of custom order
  };

  // Shift existing order indexes
  state.tasks.forEach(t => {
    t.order = (t.order ?? 0) + 1;
  });

  state.tasks.unshift(newTask);
  saveTasksToStorage();
  renderTasks();
  updateStatistics();
  showToast('Task added successfully!', 'success');
}

/**
 * Update an existing task
 * @param {string} taskId 
 * @param {Object} updatedFields 
 */
function updateTask(taskId, updatedFields) {
  const index = state.tasks.findIndex(t => t.id === taskId);
  if (index === -1) return;

  state.tasks[index] = {
    ...state.tasks[index],
    ...updatedFields,
    title: updatedFields.title.trim(),
    description: updatedFields.description ? updatedFields.description.trim() : ''
  };

  saveTasksToStorage();
  renderTasks();
  updateStatistics();
  showToast('Task updated successfully!', 'info');
}

/**
 * Toggle completed state of a task
 * @param {string} taskId 
 */
function toggleTaskCompletion(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed = !task.completed;
  saveTasksToStorage();
  renderTasks();
  updateStatistics();

  if (task.completed) {
    showToast(`Completed "${task.title.substring(0, 24)}${task.title.length > 24 ? '...' : ''}" 🎉`, 'success');
    
    // Check if ALL pending tasks are now completed
    const pendingCount = state.tasks.filter(t => !t.completed).length;
    if (pendingCount === 0 && state.tasks.length > 0) {
      launchConfettiCelebration();
      showToast('All tasks completed! Superb productivity! 🚀', 'success');
    } else {
      // Small completion burst
      launchConfettiCelebration(30);
    }
  }
}

/**
 * Delete a task by ID
 * @param {string} taskId 
 */
function deleteTask(taskId) {
  const index = state.tasks.findIndex(t => t.id === taskId);
  if (index === -1) return;

  const deletedTitle = state.tasks[index].title;
  state.tasks.splice(index, 1);
  saveTasksToStorage();
  renderTasks();
  updateStatistics();
  showToast(`Deleted task: "${deletedTitle.substring(0, 20)}..."`, 'danger');
}

/**
 * Clear all completed tasks
 */
function clearCompletedTasks() {
  const completedCount = state.tasks.filter(t => t.completed).length;
  if (completedCount === 0) {
    showToast('No completed tasks to clear', 'info');
    return;
  }

  state.tasks = state.tasks.filter(t => !t.completed);
  saveTasksToStorage();
  renderTasks();
  updateStatistics();
  showToast(`Cleared ${completedCount} completed task${completedCount > 1 ? 's' : ''}`, 'info');
}

/* ==========================================================================
   9. Modal Dialog Controller (<dialog>)
   ========================================================================== */

/**
 * Open Modal to Create New Task
 */
function openCreateTaskModal() {
  state.editingTaskId = null;
  DOM.taskModalTitle.textContent = 'Create New Task';
  DOM.saveTaskBtnText.textContent = 'Create Task';
  DOM.taskIdInput.value = '';
  DOM.taskForm.reset();

  // Set default due date to today in picker
  DOM.taskDueDateInput.value = '';
  DOM.taskDueTimeInput.value = '';

  // Reset priority radio to medium
  const mediumRadio = DOM.taskForm.querySelector('input[name="taskPriority"][value="medium"]');
  if (mediumRadio) mediumRadio.checked = true;

  // Open modal
  if (typeof DOM.taskModal.showModal === 'function') {
    DOM.taskModal.showModal();
  } else {
    DOM.taskModal.setAttribute('open', '');
  }

  // Focus title input
  setTimeout(() => DOM.taskTitleInput.focus(), 50);
}

/**
 * Open Modal to Edit Existing Task
 * @param {string} taskId 
 */
function openEditTaskModal(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  state.editingTaskId = taskId;
  DOM.taskModalTitle.textContent = 'Edit Task';
  DOM.saveTaskBtnText.textContent = 'Save Changes';
  DOM.taskIdInput.value = task.id;
  DOM.taskTitleInput.value = task.title;
  DOM.taskDescInput.value = task.description || '';
  DOM.taskDueDateInput.value = task.dueDate || '';
  DOM.taskDueTimeInput.value = task.dueTime || '';
  DOM.taskCategorySelect.value = task.category || 'Work';

  // Set priority radio
  const targetRadio = DOM.taskForm.querySelector(`input[name="taskPriority"][value="${task.priority || 'medium'}"]`);
  if (targetRadio) targetRadio.checked = true;

  if (typeof DOM.taskModal.showModal === 'function') {
    DOM.taskModal.showModal();
  } else {
    DOM.taskModal.setAttribute('open', '');
  }

  setTimeout(() => DOM.taskTitleInput.focus(), 50);
}

/**
 * Close Task Form Modal
 */
function closeTaskModal() {
  if (typeof DOM.taskModal.close === 'function') {
    DOM.taskModal.close();
  } else {
    DOM.taskModal.removeAttribute('open');
  }
  state.editingTaskId = null;
}

/**
 * Open Confirm Delete Modal
 * @param {string} taskId 
 */
function openConfirmDeleteModal(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  state.deletingTaskId = taskId;
  DOM.deleteTaskTargetTitle.textContent = `"${task.title}"`;

  if (typeof DOM.confirmDeleteModal.showModal === 'function') {
    DOM.confirmDeleteModal.showModal();
  } else {
    DOM.confirmDeleteModal.setAttribute('open', '');
  }
}

/**
 * Close Confirm Delete Modal
 */
function closeConfirmDeleteModal() {
  if (typeof DOM.confirmDeleteModal.close === 'function') {
    DOM.confirmDeleteModal.close();
  } else {
    DOM.confirmDeleteModal.removeAttribute('open');
  }
  state.deletingTaskId = null;
}

/* ==========================================================================
   10. Drag-and-Drop Reordering Engine (HTML5 DND + Touch Polyfill)
   ========================================================================== */

/**
 * Attach drag & drop listeners to a task item
 * @param {HTMLElement} itemEl 
 */
function attachDragListeners(itemEl) {
  if (state.sortBy !== 'manual') return;

  const handle = itemEl.querySelector('.task-drag-handle');

  // HTML5 Drag Events
  itemEl.addEventListener('dragstart', (e) => {
    state.draggedTaskId = itemEl.getAttribute('data-id');
    itemEl.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', state.draggedTaskId);
  });

  itemEl.addEventListener('dragend', () => {
    itemEl.classList.remove('dragging');
    clearDragOverIndicators();
    state.draggedTaskId = null;
  });

  itemEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!state.draggedTaskId || state.draggedTaskId === itemEl.getAttribute('data-id')) return;

    const rect = itemEl.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    clearDragOverIndicators();
    if (e.clientY < midY) {
      itemEl.classList.add('drag-over-top');
    } else {
      itemEl.classList.add('drag-over-bottom');
    }
  });

  itemEl.addEventListener('dragleave', () => {
    itemEl.classList.remove('drag-over-top', 'drag-over-bottom');
  });

  itemEl.addEventListener('drop', (e) => {
    e.preventDefault();
    const sourceId = state.draggedTaskId || e.dataTransfer.getData('text/plain');
    const targetId = itemEl.getAttribute('data-id');

    if (!sourceId || sourceId === targetId) {
      clearDragOverIndicators();
      return;
    }

    const rect = itemEl.getBoundingClientRect();
    const isAbove = e.clientY < (rect.top + rect.height / 2);

    reorderTasks(sourceId, targetId, isAbove);
    clearDragOverIndicators();
  });

  // Mobile Touch Drag Support
  if (handle) {
    let touchStartY = 0;
    let touchTargetEl = null;

    handle.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      touchTargetEl = itemEl;
      itemEl.classList.add('dragging');
      state.draggedTaskId = itemEl.getAttribute('data-id');
    }, { passive: true });

    handle.addEventListener('touchmove', (e) => {
      const currentY = e.touches[0].clientY;
      const elementBelow = document.elementFromPoint(e.touches[0].clientX, currentY);
      const targetItem = elementBelow ? elementBelow.closest('.task-item') : null;

      clearDragOverIndicators();
      if (targetItem && targetItem !== itemEl) {
        const rect = targetItem.getBoundingClientRect();
        if (currentY < rect.top + rect.height / 2) {
          targetItem.classList.add('drag-over-top');
        } else {
          targetItem.classList.add('drag-over-bottom');
        }
      }
    }, { passive: true });

    handle.addEventListener('touchend', (e) => {
      itemEl.classList.remove('dragging');
      const touchEndY = e.changedTouches[0].clientY;
      const elementBelow = document.elementFromPoint(e.changedTouches[0].clientX, touchEndY);
      const targetItem = elementBelow ? elementBelow.closest('.task-item') : null;

      if (targetItem && targetItem !== itemEl) {
        const sourceId = itemEl.getAttribute('data-id');
        const targetId = targetItem.getAttribute('data-id');
        const rect = targetItem.getBoundingClientRect();
        const isAbove = touchEndY < (rect.top + rect.height / 2);

        reorderTasks(sourceId, targetId, isAbove);
      }

      clearDragOverIndicators();
      state.draggedTaskId = null;
    });
  }
}

/**
 * Remove visual drag indicator borders
 */
function clearDragOverIndicators() {
  document.querySelectorAll('.task-item').forEach(el => {
    el.classList.remove('drag-over-top', 'drag-over-bottom');
  });
}

/**
 * Reorder task elements and persist new order index
 * @param {string} sourceId 
 * @param {string} targetId 
 * @param {boolean} isAbove 
 */
function reorderTasks(sourceId, targetId, isAbove) {
  const sourceIndex = state.tasks.findIndex(t => t.id === sourceId);
  const targetIndex = state.tasks.findIndex(t => t.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1) return;

  const [movedTask] = state.tasks.splice(sourceIndex, 1);
  let insertIndex = state.tasks.findIndex(t => t.id === targetId);

  if (!isAbove) {
    insertIndex += 1;
  }

  state.tasks.splice(insertIndex, 0, movedTask);

  // Recalculate order indices
  state.tasks.forEach((task, idx) => {
    task.order = idx;
  });

  saveTasksToStorage();
  renderTasks();
  showToast('Tasks reordered', 'info');
}

/* ==========================================================================
   11. Confetti Physics Celebration System
   ========================================================================== */

/**
 * Launch festive confetti particles on completed milestones
 * @param {number} particleCount 
 */
function launchConfettiCelebration(particleCount = 60) {
  const canvas = DOM.confettiCanvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#6366f1', '#8b5cf6', '#38bdf8', '#10b981', '#f59e0b', '#f43f5e', '#ec4899'];
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: canvas.width * 0.5 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -10 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
      decay: Math.random() * 0.015 + 0.01
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let activeParticles = 0;

    particles.forEach(p => {
      if (p.opacity > 0) {
        activeParticles++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.rotation += p.rotationSpeed;
        p.opacity -= p.decay;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (activeParticles > 0) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  requestAnimationFrame(animate);
}

// Resize confetti canvas on window resize
window.addEventListener('resize', () => {
  if (DOM.confettiCanvas) {
    DOM.confettiCanvas.width = window.innerWidth;
    DOM.confettiCanvas.height = window.innerHeight;
  }
});

/* ==========================================================================
   12. Toast Notification Engine
   ========================================================================== */

/**
 * Display a modern toast feedback message
 * @param {string} message 
 * @param {'success'|'danger'|'info'} type 
 */
function showToast(message, type = 'info') {
  if (!DOM.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    danger: `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    info: `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
  };

  toast.innerHTML = `
    ${icons[type] || icons.info}
    <span>${escapeHTML(message)}</span>
  `;

  DOM.toastContainer.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto remove after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3200);
}

/* ==========================================================================
   13. Event Listeners & User Interactions
   ========================================================================== */

function setupEventListeners() {
  // Theme Switcher Button
  DOM.themeToggleBtn.addEventListener('click', toggleTheme);

  // Quick Add Form Submit
  DOM.quickAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = DOM.quickAddInput.value.trim();
    if (!title) return;

    addTask({
      title: title,
      dueDate: DOM.quickAddDueDate.value || '',
      priority: DOM.quickAddPriority.value || 'medium',
      category: DOM.quickAddCategory.value || 'Work'
    });

    DOM.quickAddInput.value = '';
    DOM.quickAddDueDate.value = '';
    DOM.quickAddInput.focus();
  });

  // Status Filter Tabs (All, Pending, Completed)
  DOM.filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      DOM.filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.currentFilter = tab.getAttribute('data-filter');
      renderTasks();
    });
  });

  // Priority Filter Dropdown
  DOM.priorityFilterSelect.addEventListener('change', (e) => {
    state.currentPriorityFilter = e.target.value;
    renderTasks();
  });

  // Category Tag Pills Filter
  DOM.categoryPills.addEventListener('click', (e) => {
    const pill = e.target.closest('.category-pill');
    if (!pill) return;

    const category = pill.getAttribute('data-category');
    state.currentCategoryFilter = category;
    localStorage.setItem(STORAGE_KEYS.CATEGORY, category);
    updateActiveCategoryPill(category);
    renderTasks();
  });

  // Sort Dropdown
  DOM.sortBySelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    localStorage.setItem(STORAGE_KEYS.SORT, state.sortBy);
    renderTasks();
    updateStatistics();
  });

  // Clear Completed Batch Button
  DOM.clearCompletedBtn.addEventListener('click', clearCompletedTasks);

  // Search Input (Real-time filtering)
  DOM.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    const parentBox = DOM.searchInput.closest('.search-box');
    if (parentBox) {
      if (state.searchQuery.length > 0) {
        parentBox.classList.add('has-text');
      } else {
        parentBox.classList.remove('has-text');
      }
    }
    renderTasks();
  });

  // Clear Search Button
  DOM.clearSearchBtn.addEventListener('click', () => {
    DOM.searchInput.value = '';
    state.searchQuery = '';
    const parentBox = DOM.searchInput.closest('.search-box');
    if (parentBox) parentBox.classList.remove('has-text');
    DOM.searchInput.focus();
    renderTasks();
  });

  // Open Modal Buttons
  DOM.openNewTaskModalBtn.addEventListener('click', openCreateTaskModal);
  DOM.mobileFab.addEventListener('click', openCreateTaskModal);
  DOM.emptyStateAddBtn.addEventListener('click', openCreateTaskModal);

  // Close Task Modal Buttons
  DOM.closeTaskModalBtn.addEventListener('click', closeTaskModal);
  DOM.cancelTaskModalBtn.addEventListener('click', closeTaskModal);

  // Task Form Submission (Add or Edit)
  DOM.taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = DOM.taskTitleInput.value.trim();
    if (!title) return;

    const priorityInput = DOM.taskForm.querySelector('input[name="taskPriority"]:checked');
    const priority = priorityInput ? priorityInput.value : 'medium';

    const taskPayload = {
      title: title,
      description: DOM.taskDescInput.value.trim(),
      dueDate: DOM.taskDueDateInput.value,
      dueTime: DOM.taskDueTimeInput.value,
      priority: priority,
      category: DOM.taskCategorySelect.value
    };

    if (state.editingTaskId) {
      updateTask(state.editingTaskId, taskPayload);
    } else {
      addTask(taskPayload);
    }

    closeTaskModal();
  });

  // Confirm Delete Modal Actions
  DOM.closeDeleteModalBtn.addEventListener('click', closeConfirmDeleteModal);
  DOM.cancelDeleteBtn.addEventListener('click', closeConfirmDeleteModal);
  DOM.confirmDeleteBtn.addEventListener('click', () => {
    if (state.deletingTaskId) {
      deleteTask(state.deletingTaskId);
      closeConfirmDeleteModal();
    }
  });

  // Light-dismiss Fallback for Dialog Backdrops
  [DOM.taskModal, DOM.confirmDeleteModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          const rect = modal.getBoundingClientRect();
          const isInDialog = (
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width
          );
          if (!isInDialog) {
            if (modal === DOM.taskModal) closeTaskModal();
            if (modal === DOM.confirmDeleteModal) closeConfirmDeleteModal();
          }
        }
      });
    }
  });

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Only handle shortcuts when not focused in input/textarea
    const isEditingInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);

    if (e.key === 'Escape') {
      if (DOM.taskModal.open) closeTaskModal();
      if (DOM.confirmDeleteModal.open) closeConfirmDeleteModal();
      return;
    }

    if (!isEditingInput) {
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openCreateTaskModal();
      } else if (e.key === '/') {
        e.preventDefault();
        DOM.searchInput.focus();
        DOM.searchInput.select();
      }
    }
  });
}

/**
 * Update UI for active category pill
 * @param {string} category 
 */
function updateActiveCategoryPill(category) {
  const pills = DOM.categoryPills.querySelectorAll('.category-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-category') === category) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });
}

/* ==========================================================================
   14. Application Bootstrap
   ========================================================================== */
document.addEventListener('DOMContentLoaded', initApp);
