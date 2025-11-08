import hmac
import os
from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import UserMixin, login_required, login_user, logout_user

from app.services.auth_service import AuthService

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/auth')

class User(UserMixin):
    def __init__(self, id):
        self.id = id

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        env_user = os.getenv('APP_USER')
        if env_user and not hmac.compare_digest(username, env_user):
            flash("Usuário não existe. Verifique o usuário informado.", "error")
            return render_template('login.html', username='', clear_username=True, clear_password=True)

        try:
            valid = AuthService.validate_credentials(username, password)
            if valid:
                user = User(id=username)
                login_user(user)
                return redirect(url_for('dashboard_bp.home'))
            else:
                flash("Senha inválida. Tente novamente.", "error")
                return render_template('login.html', username=username, clear_password=True)
        except Exception:
            flash("Erro na autenticação. Tente novamente.", "error")
            return render_template('login.html', username=username, clear_password=True)

    return render_template('login.html', username='', clear_username=False, clear_password=False)

@auth_bp.route('/logout', methods=['GET'])
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth_bp.login'))
