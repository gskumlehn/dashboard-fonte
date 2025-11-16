from flask import Blueprint, render_template
from flask_login import login_required

dashboard_bp = Blueprint('dashboard_bp', __name__, url_prefix='/dashboard')

@dashboard_bp.route('/', methods=['GET'])
@login_required
def index():
    return render_template('dashboard-index.html')

@dashboard_bp.route('/home', methods=['GET'])
@login_required
def home():
    return render_template('dashboard.html')

@dashboard_bp.route('/operations', methods=['GET'])
@login_required
def volume_operations():
    return render_template('volume-operations.html')

@dashboard_bp.route('/default', methods=['GET'])
@login_required
def default_rate():
    return render_template('default-rate.html')
