from flask import Blueprint, render_template
from flask_login import login_required, current_user

dashboard_bp = Blueprint('dashboard_bp', __name__, url_prefix='/dashboard')

@dashboard_bp.route('/', methods=['GET'])
@login_required
def home():
    return render_template('dashboard.html', user=current_user)
