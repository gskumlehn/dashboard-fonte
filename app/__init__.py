from flask import Flask
from flask_login import LoginManager, UserMixin
import os

def create_app():
    app = Flask(__name__)
    app.secret_key = 'your_secret_key'

    # Inicializar Flask-Login
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'login_bp.login'

    # Definir user_loader
    class User(UserMixin):
        def __init__(self, id):
            self.id = id

    @login_manager.user_loader
    def load_user(user_id):
        # Carregar o usuário com base no ID (apenas um usuário fixo)
        if user_id == os.getenv('APP_USER'):
            return User(id=user_id)
        return None

    # Registrar blueprints
    from app.controllers.login_controller import login_bp
    from app.controllers.healthcheck_controller import healthcheck_bp
    from app.controllers.root_controller import root_bp
    app.register_blueprint(login_bp)
    app.register_blueprint(healthcheck_bp)
    app.register_blueprint(root_bp)

    return app
