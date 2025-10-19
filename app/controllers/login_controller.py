from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import UserMixin, login_user, login_required, logout_user, current_user
from services.auth_service import AuthService

login_bp = Blueprint('login_bp', __name__, template_folder='../../templates')

class User(UserMixin):
    def __init__(self, id):
        self.id = id

@login_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        try:
            AuthService.validate_credentials(username, password)
            user = User(id=username)
            login_user(user)
            return redirect(url_for('login_bp.protected'))
        except Exception:
            flash("Credenciais inválidas. Tente novamente.", "error")
            return redirect(url_for('login_bp.login'))

    return render_template('login.html')

@login_bp.route('/protected')
@login_required
def protected():
    return f'Olá, {current_user.id}! Esta é uma página protegida.'

@login_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login_bp.login'))
