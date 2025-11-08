import hmac
import os
from flask import Blueprint, flash, redirect, render_template, request, url_for, jsonify
from flask_login import UserMixin, login_required, login_user, logout_user, current_user
from app.services.auth_service import AuthService

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/auth')

class User(UserMixin):
    def __init__(self, id):
        self.id = id

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard_bp.home'))

    if request.method == 'POST':
        data = request.get_json()  # Alterado para aceitar JSON
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

        username = data['username']
        password = data['password']

        env_user = os.getenv('APP_USER')
        if env_user and not hmac.compare_digest(username, env_user):
            return jsonify({'success': False, 'message': 'Usuário não existe'}), 401

        try:
            valid = AuthService.validate_credentials(username, password)
            if valid:
                user = User(id=username)
                login_user(user, remember=True)
                return jsonify({'success': True, 'message': 'Login realizado com sucesso!'}), 200
            else:
                return jsonify({'success': False, 'message': 'Senha inválida'}), 401
        except Exception as e:
            return jsonify({'success': False, 'message': f'Erro na autenticação: {str(e)}'}), 500

    return render_template('login.html', username='', clear_username=False, clear_password=False)

@auth_bp.route('/logout', methods=['GET'])
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth_bp.login'))
