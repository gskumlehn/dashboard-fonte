from flask import Blueprint
from flask_login import login_required, current_user

dashboard_bp = Blueprint('dashboard_bp', __name__, url_prefix='/dashboard')

@dashboard_bp.route('/', methods=['GET'])
@login_required
def home():
    return f'Bem-vindo ao dashboard, {current_user.id}!'

