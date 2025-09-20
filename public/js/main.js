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

        // Load tasks from localStorage
        this.loadTasks();
        this.render();
    }

    // Add a new task
    addTask() {
        const taskText = this.taskInput.value.trim();

        if (taskText === '') {
            alert('Please enter a task!');
            return;
        }

        const newTask = {
            id: this.taskIdCounter++,
            text: taskText,
            completed: false,
            isEditing: false
        };

        this.tasks.push(newTask);
        this.taskInput.value = '';
        this.saveTasks();
        this.render();
    }

    // Delete a task
    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveTasks();
            this.render();
        }
    }

    // Toggle task completion
    toggleComplete(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    // Start editing a task
    startEdit(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            // Set all tasks to not editing first
            this.tasks.forEach(t => t.isEditing = false);
            task.isEditing = true;
            this.render();

            // Focus on the input after render
            setTimeout(() => {
                const input = document.querySelector(`[data-task-id="${taskId}"] .task-text`);
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 10);
        }
    }

    // Save edited task
    saveEdit(taskId, newText) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            const trimmedText = newText.trim();
            if (trimmedText === '') {
                alert('Task cannot be empty!');
                return;
            }
            task.text = trimmedText;
            task.isEditing = false;
            this.saveTasks();
            this.render();
        }
    }

    // Cancel editing
    cancelEdit(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.isEditing = false;
            this.render();
        }
    }

    // Remove all completed tasks
    removeCompleted() {
        const completedCount = this.tasks.filter(task => task.completed).length;

        if (completedCount === 0) {
            alert('No completed tasks to remove!');
            return;
        }

        if (confirm(`Are you sure you want to remove ${completedCount} completed task${completedCount > 1 ? 's' : ''}?`)) {
            this.tasks = this.tasks.filter(task => !task.completed);
            this.saveTasks();
            this.render();
        }
    }

    // Remove all tasks
    removeAll() {
        if (this.tasks.length === 0) {
            alert('No tasks to remove!');
            return;
        }

        if (confirm(`Are you sure you want to remove all ${this.tasks.length} task${this.tasks.length > 1 ? 's' : ''}? This action cannot be undone.`)) {
            this.tasks = [];
            this.saveTasks();
            this.render();
        }
    }

    // Render all tasks
    render() {
        this.taskList.innerHTML = '';

        if (this.tasks.length === 0) {
            this.emptyState.classList.remove('hidden');
            this.bulkActions.classList.add('hidden');
            return;
        }

        this.emptyState.classList.add('hidden');
        this.bulkActions.classList.remove('hidden');

        // Update bulk action buttons state
        const completedTasks = this.tasks.filter(task => task.completed);
        this.removeCompletedBtn.disabled = completedTasks.length === 0;

        this.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.taskList.appendChild(taskElement);
        });
    }

    // Create individual task element
    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.setAttribute('data-task-id', task.id);

        if (task.isEditing) {
            li.innerHTML = `
                <input type="text" class="task-text" value="${task.text}" maxlength="100">
                <div class="task-buttons">
                    <button class="btn save-btn" onclick="todoApp.saveEdit(${task.id}, this.parentElement.previousElementSibling.value)">Save</button>
                    <button class="btn cancel-btn" onclick="todoApp.cancelEdit(${task.id})">Cancel</button>
                </div>
            `;
        } else {
            li.innerHTML = `
                <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
                <div class="task-buttons">
                    <button class="btn complete-btn" onclick="todoApp.toggleComplete(${task.id})">
                        ${task.completed ? 'Undo' : 'Complete'}
                    </button>
                    <button class="btn edit-btn" onclick="todoApp.startEdit(${task.id})" ${task.completed ? 'disabled' : ''}>Edit</button>
                    <button class="btn delete-btn" onclick="todoApp.deleteTask(${task.id})">Delete</button>
                </div>
            `;
        }

        return li;
    }

    // Save tasks to localStorage
    saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
    }

    // Load tasks from localStorage
    loadTasks() {
        const savedTasks = localStorage.getItem('todoTasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
            // Update counter to avoid ID conflicts
            if (this.tasks.length > 0) {
                this.taskIdCounter = Math.max(...this.tasks.map(task => task.id)) + 1;
            }
        }
    }
}

// Initialize the app when the page loads
let todoApp;
document.addEventListener('DOMContentLoaded', () => {
    todoApp = new TodoTask();
});
