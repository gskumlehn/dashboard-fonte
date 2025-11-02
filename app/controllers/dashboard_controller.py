from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from app.services.dashboard_service import DashboardService

dashboard_bp = Blueprint('dashboard_bp', __name__, url_prefix='/dashboard')

@dashboard_bp.route('/', methods=['GET'])
@login_required
def home():
    return render_template('dashboard.html', user=current_user)

@dashboard_bp.route('/volume-data', methods=['GET'])
@login_required
def get_volume_data():
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        data_type = request.args.get('type', 'monthly')

        if not start_date or not end_date:
            return jsonify({"error": "start_date and end_date are required"}), 400

        service = DashboardService()

        if data_type == "daily":
            result = service.get_daily_volume_data(start_date=start_date, end_date=end_date)
        elif data_type == "monthly":
            result = service.get_monthly_volume_data(start_date=start_date, end_date=end_date)
        else:
            return jsonify({"error": "Invalid type parameter. Use 'daily' or 'monthly'."}), 400

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching volume data: {str(e)}"}), 500

@dashboard_bp.route('/default-rate', methods=['GET'])
@login_required
def get_default_rate():
    try:
        service = DashboardService()
        result = service.get_current_default_rate()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching default rate: {str(e)}"}), 500
