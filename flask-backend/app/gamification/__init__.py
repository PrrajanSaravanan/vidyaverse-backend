from flask import Blueprint

bp = Blueprint('gamification', __name__)

from app.gamification import routes