from flask import Blueprint, jsonify, request
from flask_login import login_required
from app.services.default_rate_service import DefaultRateService

default_rate_bp = Blueprint('default_rate_bp', __name__, url_prefix='/default-rate')
service = DefaultRateService()

@default_rate_bp.route('/data', methods=['GET'])
@login_required
def get_default_rate_data():
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        period_type = request.args.get('type', 'monthly')

        if not start_date or not end_date:
            return jsonify({"error": "start_date and end_date are required"}), 400

        if period_type == 'daily':
            result = service.get_daily_rate_series(start_date=start_date, end_date=end_date)
        elif period_type == 'monthly':
            result = service.get_monthly_rate_series(start_date=start_date, end_date=end_date)
        else:
            return jsonify({"error": "Invalid type parameter. Use 'daily' or 'monthly'."}), 400

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching default rate data: {str(e)}"}), 500

@default_rate_bp.route('/', methods=['GET'])
@login_required
def get_current_default_rate():
    try:
        result = service.get_current_default_rate()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching default rate: {str(e)}"}), 500
