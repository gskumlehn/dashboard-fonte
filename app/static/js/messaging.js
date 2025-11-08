class Messaging {
    constructor() {
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.autoHandleExistingMessages());
        } else {
            this.autoHandleExistingMessages();
        }
    }

    ensureContainer() {
        let container = document.getElementById('global-messages');
        if (!container) {
            container = document.createElement('div');
            container.id = 'global-messages';
            container.className = 'global-messages-container';
            document.body.appendChild(container);
        }
        return container;
    }

    removeShowClass(el) {
        el.classList.remove('show');
    }

    scheduleHide(el, timeout) {
        if (!timeout || timeout <= 0) return;
        setTimeout(() => {
            this.removeShowClass(el);
            setTimeout(() => {
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 300);
        }, timeout);
    }

    autoHandleExistingMessages(defaultTimeout = 3000) {
        const messages = document.querySelectorAll('.message');
        if (!messages.length) return;
        const container = this.ensureContainer();
        messages.forEach((el) => {
            if (el.parentElement !== container) {
                el.parentElement && el.parentElement.removeChild(el);
                container.appendChild(el);
            }
            if (el.classList.contains('show')) {
                this.scheduleHide(el, defaultTimeout);
            }
        });
    }

    createMessageElement(text, type = 'success') {
        const div = document.createElement('div');
        div.className = `message ${type} show`;
        div.textContent = text;
        return div;
    }

    show(text, type = 'success', timeout = 3000) {
        const container = this.ensureContainer();
        const el = this.createMessageElement(text, type);
        container.appendChild(el);
        this.scheduleHide(el, timeout);
        return el;
    }

    success(text, timeout = 3000) {
        return this.show(text, 'success', timeout);
    }

    error(text, timeout = 3000) {
        return this.show(text, 'error', timeout);
    }

    warning(text, timeout = 3000) {
        return this.show(text, 'warning', timeout);
    }

    info(text, timeout = 3000) {
        return this.show(text, 'info', timeout);
    }
}

window.messaging = new Messaging();

window.toast = {
    success: (text, timeout) => window.messaging.success(text, timeout),
    error: (text, timeout) => window.messaging.error(text, timeout),
    warning: (text, timeout) => window.messaging.warning(text, timeout),
    info: (text, timeout) => window.messaging.info(text, timeout),
    show: (text, type, timeout) => window.messaging.show(text, type, timeout)
};