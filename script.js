document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('task-form');
    const input = document.getElementById('task-input');
    const list = document.getElementById('task-list');
    // Load tasks from localStorage, or seed with sample content on first load
    let tasks;
    const stored = localStorage.getItem('tasks');
    if (stored === null) {
        tasks = [
            { text: 'Buy groceries', completed: false },
            { text: 'Call mom', completed: false },
            { text: 'Finish the report', completed: false },
            { text: 'Plan weekend trip', completed: false },
            { text: 'Read a chapter of a book', completed: false },
            { text: 'Practice guitar', completed: false },
            { text: 'Clean workspace', completed: false },
            { text: 'Pay bills', completed: false }
        ];
        localStorage.setItem('tasks', JSON.stringify(tasks));
    } else {
        tasks = JSON.parse(stored) || [];
    }
    // Audio setup for completion sounds
    let audioCtx;
    let completionChain = 0;
    let lastCompletionTime = 0;
    let chainResetTimer;
    // Confetti setup
    let confettiContainer;
    const confettiColors = ['#FFC107', '#28A745', '#DC3545', '#17A2B8', '#8F3F97', '#FF5722'];
    function createConfettiContainer() {
        confettiContainer = document.createElement('div');
        confettiContainer.id = 'confetti-container';
        document.body.appendChild(confettiContainer);
    }
    function triggerConfetti() {
        if (!confettiContainer) createConfettiContainer();
        const count = 100;
        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            confetti.style.left = (Math.random() * 100) + '%';
            confetti.style.top = '0px';
            confetti.style.animationDuration = (Math.random() * 2 + 1) + 's';
            confetti.style.animationDelay = (Math.random() * 0.5) + 's';
            confettiContainer.appendChild(confetti);
            confetti.addEventListener('animationend', () => confetti.remove());
        }
    }
    // Play a procedural tone; pitch increases with rapid completions
    function playCompletionSound() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const now = Date.now();
        // Increase pitch if completions occur within 1.5 seconds
        if (now - lastCompletionTime < 1500) {
            completionChain++;
        } else {
            completionChain = 1;
        }
        lastCompletionTime = now;
        clearTimeout(chainResetTimer);
        // Reset chain after 1.5 seconds of inactivity
        chainResetTimer = setTimeout(() => { completionChain = 0; }, 1500);
        const baseFreq = 440; // A4
        const freq = baseFreq * Math.pow(1.2, completionChain - 1);
        const duration = 0.15; // seconds
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        oscillator.connect(gainNode).connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    }

    // Celebration sound ("ta-da")
    function playTaDaSound() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const now = audioCtx.currentTime;
        // first note
        const freq1 = 440;
        const dur1 = 0.2;
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.value = freq1;
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.08, now + 0.02);
        gain1.gain.linearRampToValueAtTime(0, now + dur1);
        osc1.connect(gain1).connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + dur1);
        // second note with longer tail and simple reverb
        const freq2 = 660;
        const dur2 = 0.6; // longer sustain for reverb-like tail
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.value = freq2;
        gain2.gain.setValueAtTime(0, now + dur1);
        gain2.gain.linearRampToValueAtTime(0.08, now + dur1 + 0.02);
        // decay down exponentially to create a tail
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + dur1 + dur2);
        // simple reverb: delay node with feedback
        const delayNode = audioCtx.createDelay();
        delayNode.delayTime.value = 0.2;
        const feedbackGain = audioCtx.createGain();
        feedbackGain.gain.value = 0.4;
        delayNode.connect(feedbackGain).connect(delayNode);
        // connect nodes
        osc2.connect(gain2).connect(audioCtx.destination);
        gain2.connect(delayNode);
        delayNode.connect(audioCtx.destination);
        osc2.start(now + dur1);
        osc2.stop(now + dur1 + dur2);
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Create a task list item with event handlers and animations
    function createTaskElement(task) {
        const li = document.createElement('li');
        // Use flex layout and left-align text, push delete button to the right
        li.className = 'list-group-item d-flex align-items-center';
        li.style.overflow = 'hidden';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.className = 'form-check-input me-2';

        const span = document.createElement('span');
        span.textContent = task.text;
        // Flex grow for left-aligned text and to push delete button to right
        span.classList.add('flex-grow-1');
        if (task.completed) {
            span.classList.add('completed');
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.setAttribute('aria-label', 'Delete task');

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);

        // Complete animation
        checkbox.addEventListener('change', () => {
            task.completed = checkbox.checked;
            saveTasks();
            if (checkbox.checked) {
                span.classList.add('completed');
                playCompletionSound();
                li.classList.add('animate-complete');
                li.addEventListener('animationend', () => {
                    li.classList.remove('animate-complete');
                }, { once: true });
                // Celebrate if all tasks are complete
                if (tasks.every(t => t.completed)) {
                    triggerConfetti();
                    playTaDaSound();
                }
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