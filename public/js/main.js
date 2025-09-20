// Main JavaScript file
class TodoTask {
    constructor() {
        this.tasks = [];
        this.taskIdCounter = 1;
        this.init();
    }

    init() {
        // Get DOM elements
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.bulkActions = document.getElementById('bulkActions');
        this.removeCompletedBtn = document.getElementById('removeCompletedBtn');
        this.removeAllBtn = document.getElementById('removeAllBtn');

        // Bind event listeners
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
        this.removeCompletedBtn.addEventListener('click', () => this.removeCompleted());
        this.removeAllBtn.addEventListener('click', () => this.removeAll());

        // Load existing tasks
        this.loadTasks();
    }

    // Add a new task
    async addTask() {
        const taskText = this.taskInput.value.trim();

        if (taskText === '') {
            alert('Please enter a task!');
            return;
        }

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: taskText })
            });

            if (!response.ok) {
                throw new Error('Failed to add task');
            }

            const newTask = await response.json();
            this.tasks.push(newTask);
            this.taskInput.value = '';
            this.render();
        } catch (error) {
            console.error('Error adding task:', error);
            alert('Failed to add task. Please try again.');
        }
    }

    // Delete a task
    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            const response = await fetch('/api/tasks/' + taskId, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete task');
            }

            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.render();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete task. Please try again.');
        }
    }

    // Toggle task completion status
    async toggleComplete(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (!task) return;

        try {
            const response = await fetch('/api/tasks/' + taskId, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed: !task.completed })
            });

            if (!response.ok) {
                throw new Error('Failed to update task');
            }

            task.completed = !task.completed;
            this.render();
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Failed to update task. Please try again.');
        }
    }

    // Start editing a task
    startEdit(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (!task) return;

        // Reset all editing states
        this.tasks.forEach(t => t.isEditing = false);
        task.isEditing = true;
        this.render();

        // Focus on input after render
        setTimeout(() => {
            const input = document.querySelector('[data-task-id="' + taskId + '"] .task-text');
            if (input) {
                input.focus();
                input.select();
            }
        }, 10);
    }

    // Save edited task
    async saveEdit(taskId, newText) {
        const task = this.tasks.find(task => task.id === taskId);
        if (!task) return;

        const trimmedText = newText.trim();
        if (trimmedText === '') {
            alert('Task cannot be empty!');
            return;
        }

        try {
            const response = await fetch('/api/tasks/' + taskId, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: trimmedText,
                    isEditing: false
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update task');
            }

            task.text = trimmedText;
            task.isEditing = false;
            this.render();
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Failed to update task. Please try again.');
        }
    }

    // Cancel editing mode
    cancelEdit(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.isEditing = false;
            this.render();
        }
    }

    // Remove all completed tasks
    async removeCompleted() {
        const completedCount = this.tasks.filter(task => task.completed).length;

        if (completedCount === 0) {
            alert('No completed tasks to remove!');
            return;
        }

        const message = 'Are you sure you want to remove ' + completedCount +
                       ' completed task' + (completedCount > 1 ? 's' : '') + '?';

        if (!confirm(message)) return;

        try {
            const activeTasks = this.tasks.filter(task => !task.completed);
            const response = await fetch('/api/tasks/bulk', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tasks: activeTasks })
            });

            if (!response.ok) {
                throw new Error('Failed to remove completed tasks');
            }

            this.tasks = activeTasks;
            this.render();
        } catch (error) {
            console.error('Error removing completed tasks:', error);
            alert('Failed to remove completed tasks. Please try again.');
        }
    }

    // Remove all tasks
    async removeAll() {
        if (this.tasks.length === 0) {
            alert('No tasks to remove!');
            return;
        }

        const message = 'Are you sure you want to remove all ' + this.tasks.length +
                       ' task' + (this.tasks.length > 1 ? 's' : '') +
                       '? This action cannot be undone.';

        if (!confirm(message)) return;

        try {
            const response = await fetch('/api/tasks/bulk', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tasks: [] })
            });

            if (!response.ok) {
                throw new Error('Failed to remove all tasks');
            }

            this.tasks = [];
            this.render();
        } catch (error) {
            console.error('Error removing all tasks:', error);
            alert('Failed to remove all tasks. Please try again.');
        }
    }

    // Render all tasks to the DOM
    render() {
        // Clear existing content
        this.taskList.innerHTML = '';

        // Show/hide empty state and bulk actions
        if (this.tasks.length === 0) {
            this.emptyState.style.display = 'block';
            this.bulkActions.style.display = 'none';
        } else {
            this.emptyState.style.display = 'none';
            this.bulkActions.style.display = 'block';
        }

        // Sort tasks by creation time (newest first) - tasks without createdAt go to the end
        const sortedTasks = [...this.tasks].sort((a, b) => {
            // Handle tasks without createdAt (put them at the end)
            if (!a.createdAt && !b.createdAt) return 0;
            if (!a.createdAt) return 1;
            if (!b.createdAt) return -1;

            // Sort by creation time descending (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Add each task to the DOM
        sortedTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.taskList.appendChild(taskElement);
        });
    }

    // Create a DOM element for a single task
    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = 'task-item' + (task.completed ? ' completed' : '');
        li.setAttribute('data-task-id', task.id);

        // Format creation time if available
        const createdTime = task.createdAt ? this.formatCreationTime(task.createdAt) : '';
        const timeDisplay = createdTime ? '<div class="task-time">⏱ ' + createdTime + '</div>' : '';

        if (task.isEditing) {
            // Editing mode HTML
            li.innerHTML =
                '<div class="task-content editing">' +
                    '<input type="text" class="task-text" ' +
                           'value="' + task.text.replace(/"/g, '&quot;') + '" ' +
                           'onkeypress="if(event.key===\'Enter\') todoApp.saveEdit(' + task.id + ', this.value)" ' +
                           'onblur="todoApp.saveEdit(' + task.id + ', this.value)">' +
                '</div>' +
                '<div class="task-buttons">' +
                    '<button class="btn save-btn" ' +
                            'onclick="todoApp.saveEdit(' + task.id + ', this.parentElement.previousElementSibling.querySelector(\'.task-text\').value)">' +
                        'Save' +
                    '</button>' +
                    '<button class="btn cancel-btn" onclick="todoApp.cancelEdit(' + task.id + ')">' +
                        'Cancel' +
                    '</button>' +
                '</div>';
        } else {
            // Display mode HTML
            li.innerHTML =
                '<div class="task-content">' +
                    '<span class="task-text' + (task.completed ? ' completed' : '') + '">' +
                        task.text +
                    '</span>' +
                    timeDisplay +
                '</div>' +
                '<div class="task-buttons">' +
                    '<button class="btn complete-btn" onclick="todoApp.toggleComplete(' + task.id + ')">' +
                        (task.completed ? 'Undo' : 'Complete') +
                    '</button>' +
                    '<button class="btn edit-btn" onclick="todoApp.startEdit(' + task.id + ')"' +
                           (task.completed ? ' disabled' : '') + '>' +
                        'Edit' +
                    '</button>' +
                    '<button class="btn delete-btn" onclick="todoApp.deleteTask(' + task.id + ')">' +
                        'Delete' +
                    '</button>' +
                '</div>';
        }

        return li;
    }

    // Format creation time for display
    formatCreationTime(isoString) {
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            // Show relative time for recent tasks
            if (diffMins < 1) {
                return 'just now';
            } else if (diffMins < 60) {
                return diffMins + ' min' + (diffMins === 1 ? '' : 's') + ' ago';
            } else if (diffHours < 24) {
                return diffHours + ' hour' + (diffHours === 1 ? '' : 's') + ' ago';
            } else if (diffDays < 7) {
                return diffDays + ' day' + (diffDays === 1 ? '' : 's') + ' ago';
            } else {
                // For older tasks, show the actual date
                return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }
        } catch (error) {
            console.warn('Invalid date format:', isoString);
            return '';
        }
    }

    // Load tasks from the API
    async loadTasks() {
        try {
            const response = await fetch('/api/tasks');

            if (!response.ok) {
                throw new Error('Failed to load tasks');
            }

            const data = await response.json();
            this.tasks = data.tasks || [];
            this.taskIdCounter = data.taskIdCounter || 1;

            // Add default createdAt for existing tasks that don't have it
            this.tasks.forEach(task => {
                if (!task.createdAt) {
                    task.createdAt = new Date().toISOString();
                }
            });

            this.render();
        } catch (error) {
            console.error('Error loading tasks:', error);
            // Fallback to empty state
            this.tasks = [];
            this.taskIdCounter = 1;
            this.render();
        }
    }
}

// Initialize the application when DOM is ready
let todoApp;
document.addEventListener('DOMContentLoaded', () => {
    todoApp = new TodoTask();
});
