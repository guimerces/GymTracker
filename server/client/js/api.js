const API_BASE = '/api';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('gymtracker_token');
    }

    setToken(token) {
        this.token = token;
        if (token) localStorage.setItem('gymtracker_token', token);
        else localStorage.removeItem('gymtracker_token');
    }

    getToken() { return this.token; }

    isAuthenticated() { return !!this.token; }

    async request(method, path, body = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

        const opts = { method, headers };
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(`${API_BASE}${path}`, opts);

        if (res.status === 401) {
            this.setToken(null);
            window.location.href = '/';
            throw new Error('Sessão expirada');
        }

        if (res.status === 204) return null;

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
        return data;
    }

    // Auth
    register(name, email, password) { return this.request('POST', '/auth/register', { name, email, password }); }
    login(email, password) { return this.request('POST', '/auth/login', { email, password }); }
    getMe() { return this.request('GET', '/auth/me'); }

    // Workouts
    getWorkouts() { return this.request('GET', '/workouts'); }
    createWorkout(name) { return this.request('POST', '/workouts', { name }); }
    updateWorkout(id, data) { return this.request('PUT', `/workouts/${id}`, data); }
    deleteWorkout(id) { return this.request('DELETE', `/workouts/${id}`); }

    // Exercises
    getExercises(workoutId) { return this.request('GET', `/workouts/${workoutId}/exercises`); }
    addExercise(workoutId, data) { return this.request('POST', `/workouts/${workoutId}/exercises`, data); }
    updateExercise(id, data) { return this.request('PUT', `/exercises/${id}`, data); }
    deleteExercise(id) { return this.request('DELETE', `/exercises/${id}`); }

    // Sessions
    getSessions(limit = 20) { return this.request('GET', `/sessions?limit=${limit}`); }
    getSuggestion() { return this.request('GET', '/sessions/suggest'); }
    getActiveSession() { return this.request('GET', '/sessions/active'); }
    startSession(workoutId) { return this.request('POST', '/sessions', { workout_id: workoutId }); }
    finishSession(id, durationSeconds) { return this.request('PUT', `/sessions/${id}/finish`, { duration_seconds: durationSeconds }); }
    getSessionSets(id) { return this.request('GET', `/sessions/${id}/sets`); }
    addSet(sessionId, data) { return this.request('POST', `/sessions/${sessionId}/sets`, data); }
    deleteSet(sessionId, setId) { return this.request('DELETE', `/sessions/${sessionId}/sets/${setId}`); }

    // Stats
    getWeightProgress(exercise) { return this.request('GET', `/stats/weight-progress?exercise=${encodeURIComponent(exercise)}`); }
    getExerciseList() { return this.request('GET', '/stats/exercises'); }
    getOverview() { return this.request('GET', '/stats/overview'); }

    logout() { this.setToken(null); window.location.href = '/'; }
}

window.api = new ApiClient();

// Toast notifications
window.showToast = function(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 300); }, 3500);
};

// Format time helper
window.formatTime = function(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
