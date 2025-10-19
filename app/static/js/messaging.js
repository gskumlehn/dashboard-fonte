(function messagingModule() {
    function ensureContainer() {
        let container = document.getElementById('global-messages');
        if (!container) {
            container = document.createElement('div');
            container.id = 'global-messages';
            container.className = 'global-messages-container';
            document.body.appendChild(container);
        }
        return container;
    }

    function removeShowClass(el) {
        el.classList.remove('show');
    }

    function scheduleHide(el, timeout) {
        if (!timeout || timeout <= 0) return;
        setTimeout(() => {
            removeShowClass(el);
            // remove element after transition (give 300ms)
            setTimeout(() => {
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 300);
        }, timeout);
    }

    function autoHandleExistingMessages(defaultTimeout = 3000) {
        const messages = document.querySelectorAll('.message');
        if (!messages.length) return;
        const container = ensureContainer();
        messages.forEach((el) => {
            if (el.parentElement !== container) {
                el.parentElement && el.parentElement.removeChild(el);
                container.appendChild(el);
            }
            // se já tem classe show, agendar esconder; se não tiver, não faz nada
            if (el.classList.contains('show')) {
                scheduleHide(el, defaultTimeout);
            }
        });
    }

    function createMessageElement(text, type = 'success') {
        const div = document.createElement('div');
        div.className = `message ${type} show`;
        div.textContent = text;
        return div;
    }

    function show(text, type = 'success', timeout = 3000) {
        const container = ensureContainer();
        const el = createMessageElement(text, type);
        container.appendChild(el);
        scheduleHide(el, timeout);
        return el;
    }

    document.addEventListener('DOMContentLoaded', () => {
        autoHandleExistingMessages();
    });

    window.Messaging = {
        show,
        _internal: {
            scheduleHide,
            removeShowClass,
            ensureContainer
        }
    };
})();
