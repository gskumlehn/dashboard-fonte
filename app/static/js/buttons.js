document.addEventListener('DOMContentLoaded', function() {
    initializeButtons();
});

function initializeButtons() {
    const buttons = document.querySelectorAll('.btn');

    buttons.forEach(button => {
        if (button.dataset.initialized) return;
        button.dataset.initialized = 'true';
        button.addEventListener('click', createRipple);
    });
}

function createRipple(event) {
    const button = event.currentTarget;
    if (button.disabled || button.classList.contains('is-loading')) {
        return;
    }

    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    const existingRipples = button.querySelectorAll('.ripple');
    existingRipples.forEach(r => r.remove());

    button.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

function setButtonLoading(buttonId, isLoading = true) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    if (isLoading) {
        button.classList.add('is-loading');
        button.disabled = true;
    } else {
        button.classList.remove('is-loading');
        button.disabled = false;
    }
}

function disableButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = true;
    }
}

function enableButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = false;
    }
}

function addButtonClickHandler(buttonId, handler) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            handler(event);
        });
    }
}

window.ButtonComponent = {
    setLoading: setButtonLoading,
    disable: disableButton,
    enable: enableButton,
    addClickHandler: addButtonClickHandler,
    initialize: initializeButtons
};

const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
.btn {
    position: relative;
    overflow: hidden;
}

.ripple {
    position: absolute;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.5);
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
}

@keyframes ripple-animation {
    to {
        transform: scale(2);
        opacity: 0;
    }
}
`;
document.head.appendChild(rippleStyle);