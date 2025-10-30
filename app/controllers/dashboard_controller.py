from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from app.services.dashboard_service import DashboardService

dashboard_bp = Blueprint('dashboard_bp', __name__, url_prefix='/dashboard')

@dashboard_bp.route('/', methods=['GET'])
@login_required
def home():
    return render_template('dashboard.html', user=current_user)

@dashboard_bp.route('/volume-data', methods=['GET'])
def get_volume_data():
    try:
        # Recebe apenas start_date e end_date como parâmetros
        start_date = request.args.get('start_date')  # Exemplo: '2023-01-01'
        end_date = request.args.get('end_date')      # Exemplo: '2023-12-31'

        if not start_date or not end_date:
            return jsonify({"error": "start_date and end_date are required"}), 400

        service = DashboardService()
        result = service.get_monthly_volume_data(start_date=start_date, end_date=end_date)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching volume data: {str(e)}"}), 500
