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
    """
    Endpoint para retornar dados agregados de volume por período.
    Query params:
      - period: 'day' | 'month' | 'year' (default: 'month')
      - start_date: 'YYYY-MM-DD' (opcional)
      - end_date: 'YYYY-MM-DD' (opcional)
    Retorna JSON: { data: [{ period, period_formatted, total_volume, operation_count }, ...] }
    """
    try:
        period = request.args.get('period', 'month')
        start_date = request.args.get('start_date')  # pode ser None
        end_date = request.args.get('end_date')      # pode ser None

        service = DashboardService()
        result = service.get_volume_data(period=period, start_date=start_date, end_date=end_date)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching volume data: {str(e)}"}), 500
