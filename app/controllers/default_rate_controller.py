from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required
from app.services.default_rate_service import DefaultRateService

default_rate_bp = Blueprint('default_rate_bp', __name__, url_prefix='/default-rate')

@default_rate_bp.route('/', methods=['GET'])
@login_required
def home():
    return render_template('default_rate.html')

@default_rate_bp.route('/data', methods=['GET'])
@login_required
def get_default_rate_data():
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        if not start_date or not end_date:
            return jsonify({"error": "start_date and end_date are required"}), 400

        service = DefaultRateService()
        result = service.get_daily_default_rate(start_date=start_date, end_date=end_date)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching default rate data: {str(e)}"}), 500
