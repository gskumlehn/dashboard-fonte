from flask import Blueprint, redirect, url_for

root_bp = Blueprint('root_bp', __name__)

@root_bp.route('/')
def root():
    return redirect(url_for('login_bp.login'))
