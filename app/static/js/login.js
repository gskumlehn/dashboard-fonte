(function loginModule() {
    function boolFromString(v) {
        return String(v) === 'true';
    }

    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('login-container');
        if (!container) return;

        const clearUsername = boolFromString(container.dataset.clearUsername);
        const clearPassword = boolFromString(container.dataset.clearPassword);

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
    });
})();

