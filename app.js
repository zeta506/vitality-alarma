document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables (load from localStorage) ---
    let appointments = loadFromStorage('vitality-appointments', []);
    let medications = loadFromStorage('vitality-medications', []);
    let waterLog = loadFromStorage('vitality-water-log', []);

    // --- localStorage helpers ---
    function saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn('Error saving to localStorage:', e);
        }
    }

    function loadFromStorage(key, defaultValue) {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch (e) {
            console.warn('Error loading from localStorage:', e);
            return defaultValue;
        }
    }

    function saveAppointments() {
        saveToStorage('vitality-appointments', appointments);
    }

    function saveMedications() {
        saveToStorage('vitality-medications', medications);
    }

    function saveWaterLog() {
        saveToStorage('vitality-water-log', waterLog);
    }

    // --- Service Worker & Push Notifications ---
    let swRegistration = null;

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                swRegistration = registration;
                console.log('Service Worker registrado:', registration.scope);
                initPushNotifications(registration);
            })
            .catch((err) => {
                console.warn('Error registrando Service Worker:', err);
            });
    }

    function initPushNotifications(registration) {
        if (!('Notification' in window)) {
            console.warn('Este navegador no soporta notificaciones.');
            return;
        }

        if (Notification.permission === 'granted') {
            console.log('Notificaciones ya permitidas.');
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    console.log('Notificaciones permitidas.');
                }
            });
        }
    }

    // Send push notification via Service Worker
    function sendPushNotification(title, body, tag) {
        if (swRegistration && Notification.permission === 'granted') {
            swRegistration.showNotification(title, {
                body: body,
                icon: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
                badge: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
                vibrate: [200, 100, 200],
                tag: tag || 'vitality-' + Date.now(),
                renotify: true,
                actions: [
                    { action: 'open', title: 'Abrir Vitality' },
                    { action: 'dismiss', title: 'Descartar' }
                ]
            });
        }
    }

    const clockEl = document.getElementById('current-time');
    const eventsListEl = document.getElementById('events-list');
    const waterListEl = document.getElementById('water-list');
    const waterSummaryEl = document.getElementById('water-summary');
    const alarmSound = document.getElementById('alarm-sound');
    const toastContainer = document.getElementById('toast-container');

    // --- Core Clock and Checker ---
    setInterval(() => {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        checkAlarms(now);
    }, 1000);

    // --- Helper function to create toasts ---
    function showToast(title, message, type, eventId) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        if (eventId) toast.dataset.eventId = eventId;
        if (type.includes('app')) toast.dataset.eventType = 'app';
        else if (type.includes('med')) toast.dataset.eventType = 'med';

        let iconClass = 'fa-bell';
        if (type.includes('app')) iconClass = 'fa-calendar-check';
        if (type.includes('med')) iconClass = 'fa-pills';
        if (type.includes('water')) iconClass = 'fa-glass-water';
        if (type.includes('advance')) iconClass = 'fa-clock-rotate-left';
        if (type.includes('alarm')) iconClass = 'fa-triangle-exclamation';

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fa-solid ${iconClass}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close"><i class="fa-solid fa-xmark"></i></button>
        `;

        toastContainer.appendChild(toast);

        // Push notification via Service Worker (persistent, works in background)
        sendPushNotification(title, message, type);

        // Play Sound
        const isAlarm = type.includes('alarm');
        try {
            alarmSound.currentTime = 0;
            alarmSound.loop = isAlarm;
            alarmSound.play().catch(e => console.log("Audio play blocked by browser until user interacts."));
        } catch(e) {}

        // Bind close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            stopAlarmSound();
            // Delete the event when dismissing an alarm
            if (isAlarm && toast.dataset.eventId) {
                const id = parseInt(toast.dataset.eventId);
                if (toast.dataset.eventType === 'app') {
                    appointments = appointments.filter(a => a.id !== id);
                    saveAppointments();
                } else if (toast.dataset.eventType === 'med') {
                    medications = medications.filter(m => m.id !== id);
                    saveMedications();
                }
                renderEvents();
            }
            removeToast(toast);
        });

        if (isAlarm) {
            // Alarm toasts stay until dismissed manually (no auto-close)
            toast.classList.add('persistent-alarm');
        } else {
            // Auto close after 15 seconds for non-alarm toasts
            setTimeout(() => {
                removeToast(toast);
            }, 15000);
        }
    }

    function stopAlarmSound() {
        alarmSound.pause();
        alarmSound.loop = false;
        alarmSound.currentTime = 0;
    }

    function removeToast(toastElement) {
        toastElement.classList.add('hiding');
        // If no more alarm toasts remain, stop the sound
        setTimeout(() => {
            toastElement.remove();
            const remainingAlarms = toastContainer.querySelectorAll('.persistent-alarm');
            if (remainingAlarms.length === 0) {
                stopAlarmSound();
            }
        }, 300);
    }

    // --- Check Alarms ---
    function checkAlarms(now) {
        const currentDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        const currentSeconds = now.getSeconds();

        if (currentSeconds !== 0) return;

        // 1. Appointments
        appointments.forEach(app => {
            if (app.date === currentDate) {
                const appTimeObj = new Date(`${app.date}T${app.time}`);
                const advanceTimeObj = new Date(appTimeObj.getTime() - 60 * 60 * 1000);
                const advTimeString = String(advanceTimeObj.getHours()).padStart(2, '0') + ':' + String(advanceTimeObj.getMinutes()).padStart(2, '0');

                if (currentTime === advTimeString && !app.advanceNotified) {
                    showToast('Recordatorio Anticipado de Cita', `En 1 hora tienes cita: ${app.title}`, 'app-advance');
                    app.advanceNotified = true;
                    saveAppointments();
                }

                if (currentTime === app.time && !app.alarmNotified) {
                    showToast('¡ALERTA DE CITA!', `Es hora de tu cita médica: ${app.title}`, 'app-alarm', app.id);
                    app.alarmNotified = true;
                    saveAppointments();
                }
            }
        });

        // 2. Medications
        medications.forEach(med => {
            if (med.date === currentDate) {
                const medTimeObj = new Date(`${med.date}T${med.time}`);
                const advanceTimeObj = new Date(medTimeObj.getTime() - 60 * 60 * 1000);
                const advTimeString = String(advanceTimeObj.getHours()).padStart(2, '0') + ':' + String(advanceTimeObj.getMinutes()).padStart(2, '0');

                if (currentTime === advTimeString && !med.advanceNotified) {
                    showToast('Recordatorio Anticipado', `En 1 hora debes tomar: ${med.name}`, 'med-advance');
                    med.advanceNotified = true;
                    saveMedications();
                }

                if (currentTime === med.time && !med.alarmNotified) {
                    showToast('¡ALARMA DE MEDICAMENTO!', `Es hora de tomar tu medicamento: ${med.name}`, 'med-alarm', med.id);
                    med.alarmNotified = true;
                    saveMedications();
                }
            }
        });
    }

    // --- Form Handling ---
    document.getElementById('appointment-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('app-title').value;
        const date = document.getElementById('app-date').value;
        const time = document.getElementById('app-time').value;

        appointments.push({
            id: Date.now(),
            title, date, time,
            advanceNotified: false,
            alarmNotified: false
        });

        saveAppointments();
        e.target.reset();
        renderEvents();
        showToast('Éxito', 'Cita médica guardada correctamente.', 'app-advance');
    });

    document.getElementById('medication-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('med-name').value;
        const date = document.getElementById('med-date').value;
        const time = document.getElementById('med-time').value;

        medications.push({
            id: Date.now(),
            name, date, time,
            advanceNotified: false,
            alarmNotified: false
        });

        saveMedications();
        e.target.reset();
        renderEvents();
        showToast('Éxito', 'Medicamento guardado correctamente.', 'med-advance');
    });

    document.getElementById('water-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseInt(document.getElementById('water-amount').value);
        const time = document.getElementById('water-time').value;
        const today = new Date();
        const date = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

        waterLog.push({
            id: Date.now(),
            amount,
            time,
            date
        });

        saveWaterLog();
        e.target.reset();
        document.getElementById('water-amount').value = 1;
        renderWaterLog();
        showToast('Hidratación', `${amount} vaso(s) registrado(s) a las ${time}.`, 'water-reminder');
    });

    // --- Render Events List ---
    function renderEvents() {
        eventsListEl.innerHTML = '';

        const combined = [
            ...appointments.map(a => ({...a, type: 'app'})),
            ...medications.map(m => ({...m, type: 'med'}))
        ];

        combined.sort((a,b) => {
            return new Date(a.date+'T'+a.time) - new Date(b.date+'T'+b.time);
        });

        if (combined.length === 0) {
            eventsListEl.innerHTML = '<div class="empty-state">No hay eventos programados.</div>';
            return;
        }

        combined.forEach(item => {
            const div = document.createElement('div');
            div.className = `event-item ${item.type}`;

            const icon = item.type === 'app' ? 'fa-calendar-check' : 'fa-pills';
            const title = item.type === 'app' ? item.title : item.name;
            const subtitle = item.type === 'app' ? 'Cita' : 'Medicamento';

            div.innerHTML = `
                <div class="event-details">
                    <h4><i class="fa-solid ${icon}"></i> ${title}</h4>
                    <p>${subtitle} | Fecha: ${item.date} | Hora: ${item.time}</p>
                </div>
                <div class="event-actions">
                    <button data-id="${item.id}" data-type="${item.type}"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;

            eventsListEl.appendChild(div);
        });

        // Delete handlers
        document.querySelectorAll('.event-actions button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                const type = e.currentTarget.getAttribute('data-type');
                if(type === 'app') {
                    appointments = appointments.filter(a => a.id !== id);
                    saveAppointments();
                } else {
                    medications = medications.filter(m => m.id !== id);
                    saveMedications();
                }
                renderEvents();
            });
        });
    }

    // Test alarm
    document.getElementById('test-notification-btn').addEventListener('click', () => {
        showToast('Prueba de Sistema', '¡Esta es una alarma de prueba funcional con sonido!', 'app-alarm');
    });

    // --- Render Water Log ---
    function renderWaterLog() {
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

        const todayEntries = waterLog.filter(w => w.date === todayStr);
        const totalGlasses = todayEntries.reduce((sum, w) => sum + w.amount, 0);

        waterSummaryEl.textContent = `${totalGlasses} vaso${totalGlasses !== 1 ? 's' : ''} hoy`;

        waterListEl.innerHTML = '';

        if (todayEntries.length === 0) {
            waterListEl.innerHTML = '<div class="empty-state">No hay registros de agua hoy.</div>';
            return;
        }

        todayEntries.sort((a, b) => a.time.localeCompare(b.time));

        todayEntries.forEach(entry => {
            const div = document.createElement('div');
            div.className = 'water-entry';
            div.innerHTML = `
                <div class="water-entry-info">
                    <i class="fa-solid fa-glass-water"></i>
                    <span>${entry.amount} vaso${entry.amount !== 1 ? 's' : ''}</span>
                    <span class="water-entry-time">${entry.time}</span>
                </div>
                <button class="water-entry-delete" data-id="${entry.id}"><i class="fa-solid fa-xmark"></i></button>
            `;
            waterListEl.appendChild(div);
        });

        waterListEl.querySelectorAll('.water-entry-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                waterLog = waterLog.filter(w => w.id !== id);
                saveWaterLog();
                renderWaterLog();
            });
        });
    }

    // Initialize display
    renderEvents();
    renderWaterLog();
});
