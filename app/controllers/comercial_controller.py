from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required
from app.services.comercial_service import ComercialService

comercial_bp = Blueprint('comercial_bp', __name__, url_prefix='/comercial')

@comercial_bp.route('/churn-analysis', methods=['GET'])
@login_required
def render_churn_analysis():
    return render_template('churnAnalysis.html')

@comercial_bp.route('/churn-analysis/data', methods=['GET'])
@login_required
def fetch_churn_data():
    try:
        page = int(request.args.get('page', 1))
        items_per_page = int(request.args.get('items_per_page', 10))
        sort_column = request.args.get('sort_column', 'VolumeHistorico')
        sort_direction = request.args.get('sort_direction', 'DESC').upper()

        churn_data = ComercialService.get_churn_data(
            page=page,
            items_per_page=items_per_page,
            sort_column=sort_column,
            sort_direction=sort_direction
        )
        return jsonify(churn_data), 200
    except Exception as e:
        return jsonify({"error": f"Erro ao buscar dados de churn: {str(e)}"}), 500
