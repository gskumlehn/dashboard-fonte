from flask import Blueprint, render_template, jsonify
from flask_login import login_required
from app.services.comercial_service import ComercialService

comercial_bp = Blueprint('comercial_bp', __name__, url_prefix='/comercial')

@comercial_bp.route('/churn-analysis', methods=['GET'])
@login_required
def render_churn_analysis():
    """Renderiza a página de análise de churn."""
    return render_template('churnAnalysis.html')

@comercial_bp.route('/churn-analysis/data', methods=['GET'])
@login_required
def fetch_churn_data():
    """Busca os dados de churn e retorna como JSON."""
    try:
        data = ComercialService.get_churn_data()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
