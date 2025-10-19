from flask import Flask
from flask_login import LoginManager, UserMixin
from dotenv import load_dotenv
import os


def create_app():
    app = Flask(__name__)
    load_dotenv()

    app.secret_key = os.getenv("SECRET_KEY", "default_secret_key")  # Define a secret_key

    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'login_bp.login'

    class User(UserMixin):
        def __init__(self, id):
            self.id = id

    @login_manager.user_loader
    def load_user(user_id):
        if user_id == os.getenv('APP_USER'):
            return User(id=user_id)
        return None

    from app.controllers.login_controller import login_bp
    from app.controllers.healthcheck_controller import healthcheck_bp
    from app.controllers.root_controller import root_bp
    app.register_blueprint(login_bp)
    app.register_blueprint(healthcheck_bp)
    app.register_blueprint(root_bp)

    return app
