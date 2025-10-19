from flask import Blueprint, render_template, redirect, url_for, request
from flask_login import UserMixin, login_user, login_required, logout_user, current_user
import os

login_bp = Blueprint('login_bp', __name__, template_folder='../../templates')

class User(UserMixin):
    def __init__(self, id):
        self.id = id

@login_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        # Validação de credenciais usando variáveis de ambiente
        if username == os.getenv('APP_USER') and password == os.getenv('APP_PASSWORD'):
            user = User(id=username)
            login_user(user)
            return redirect(url_for('login_bp.protected'))
        return 'Credenciais inválidas'
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
