from flask import Flask
from flask_login import LoginManager, UserMixin
from dotenv import load_dotenv
import os

def create_app():
    app = Flask(__name__, static_folder='static', template_folder='templates')
    load_dotenv()

    app.secret_key = os.getenv("SECRET_KEY")

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
    from app.controllers.dashboard_controller import dashboard_bp
    from app.controllers.comercial_controller import comercial_bp
    app.register_blueprint(login_bp)
    app.register_blueprint(healthcheck_bp)
    app.register_blueprint(root_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(comercial_bp)

    return app
