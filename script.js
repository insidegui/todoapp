document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('task-form');
    const input = document.getElementById('task-input');
    const list = document.getElementById('task-list');
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Create a task list item with event handlers and animations
    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.style.overflow = 'hidden';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.className = 'form-check-input me-2';

        const span = document.createElement('span');
        span.textContent = task.text;
        if (task.completed) {
            span.classList.add('completed');
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-sm';
        deleteBtn.textContent = 'Delete';

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);

        // Complete animation
        checkbox.addEventListener('change', () => {
            task.completed = checkbox.checked;
            saveTasks();
            if (checkbox.checked) {
                span.classList.add('completed');
                li.classList.add('animate-complete');
                li.addEventListener('animationend', () => {
                    li.classList.remove('animate-complete');
                }, { once: true });
            } else {
                span.classList.remove('completed');
            }
        });

        // Delete animation
        deleteBtn.addEventListener('click', () => {
            li.classList.add('animate-delete');
            li.addEventListener('animationend', () => {
                tasks = tasks.filter(t => t !== task);
                saveTasks();
                li.remove();
            }, { once: true });
        });

        return li;
    }

    // Render all tasks initially
    function renderTasks() {
        list.innerHTML = '';
        tasks.forEach(task => {
            list.appendChild(createTaskElement(task));
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text !== '') {
            const newTask = { text, completed: false };
            tasks.push(newTask);
            saveTasks();
            const li = createTaskElement(newTask);
            li.classList.add('animate-add');
            list.appendChild(li);
            li.addEventListener('animationend', () => {
                li.classList.remove('animate-add');
            }, { once: true });
            input.value = '';
        }
    });

    renderTasks();
});