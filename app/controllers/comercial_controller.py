from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required
from app.services.comercial_service import ComercialService

comercial_bp = Blueprint('comercial_bp', __name__, url_prefix='/comercial')

@comercial_bp.route('/client-analysis', methods=['GET'])
@login_required
def render_client_analysis():
    return render_template('comercial.html')

@comercial_bp.route('/client-data', methods=['GET'])
@login_required
def fetch_client_data():
    try:
        page = int(request.args.get('page', 1))
        items_per_page = int(request.args.get('items_per_page', 10))
        sort_column = request.args.get('sort_column', 'HistoricalVolume')
        sort_direction = request.args.get('sort_direction', 'DESC').upper()
        risk_filter = request.args.get('risk_filter', '')

        result = ComercialService.get_client_data(
            page=page,
            items_per_page=items_per_page,
            sort_column=sort_column,
            sort_direction=sort_direction,
            risk_filter=risk_filter
        )
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Erro ao buscar dados de clientes: {str(e)}"}), 500
