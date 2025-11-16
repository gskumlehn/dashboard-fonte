from dotenv import load_dotenv
from flask import Flask
from flask_login import LoginManager, UserMixin
import os

def create_app():
    app = Flask(__name__, static_folder='static', template_folder='templates')
    load_dotenv()

    app.secret_key = os.getenv("SECRET_KEY")

    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth_bp.login'

    class User(UserMixin):
        def __init__(self, id):
            self.id = id

    @login_manager.user_loader
    def load_user(user_id):
        env_user = os.getenv('APP_USER')
        if user_id == env_user:
            return User(id=user_id)
        return None

    from app.controllers.auth_controller import auth_bp
    from app.controllers.comercial_controller import comercial_bp
    from app.controllers.dashboard_controller import dashboard_bp
    from app.controllers.healthcheck_controller import healthcheck_bp
    from app.controllers.root_controller import root_bp
    from app.controllers.operations_controller import operations_bp
    from app.controllers.default_rate_controller import default_rate_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(comercial_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(healthcheck_bp)
    app.register_blueprint(root_bp)
    app.register_blueprint(operations_bp)
    app.register_blueprint(default_rate_bp)

    return app
