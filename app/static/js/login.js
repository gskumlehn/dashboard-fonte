class Login {
    constructor() {
        this.form = null;
        this.messageEl = null;
        this.initialize();
    }

    initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.form = document.getElementById('loginForm');
        this.messageEl = document.getElementById('message');
        
        this.clearFieldsIfNeeded();
        this.attachEventListeners();
    }

    boolFromString(v) {
        return String(v) === 'true';
    }

    showMessage(text, type) {
        if (!this.messageEl) return;
        
        this.messageEl.textContent = text;
        this.messageEl.className = `message ${type} show`;
        
        setTimeout(() => {
            this.messageEl.classList.remove('show');
        }, 3000);
    }

    clearFieldsIfNeeded() {
        const container = document.getElementById('login-container');
        if (!container) return;

        const clearUsername = this.boolFromString(container.dataset.clearUsername);
        const clearPassword = this.boolFromString(container.dataset.clearPassword);

        const usernameEl = document.getElementById('username');
        const passwordEl = document.getElementById('password');

        if (clearUsername && usernameEl) {
            usernameEl.value = '';
        }

        if (clearPassword && passwordEl) {
            passwordEl.value = '';
        }

        if (clearUsername || clearPassword) {
            if (passwordEl) passwordEl.focus();
            else if (usernameEl) usernameEl.focus();
        }
    }

    attachEventListeners() {
        if (!this.form) return;

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit(e);
        });
    }

    async handleSubmit(e) {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showMessage('Por favor, preencha todos os campos', 'error');
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        if (username && password) {
            const userData = {
                id: '1',
                username: username,
                email: username,
                role: username.includes('admin') ? 'admin' : 'user'
            };

            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('isAuthenticated', 'true');
            
            if (window.toast) {
                window.toast.success('Login realizado com sucesso!');
            } else {
                this.showMessage('Login realizado com sucesso!', 'success');
            }
            
            setTimeout(() => {
                window.location.href = '/dashboard/';
            }, 1000);
        } else {
            if (window.toast) {
                window.toast.error('Usuário ou senha inválidos');
            } else {
                this.showMessage('Usuário ou senha inválidos', 'error');
            }
        }
    }

    static isAuthenticated() {
        return localStorage.getItem('isAuthenticated') === 'true';
    }

    static getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    static logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        window.location.href = '/login.html';
    }
}

const loginInstance = new Login();
window.Login = Login;