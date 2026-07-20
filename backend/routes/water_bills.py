from flask import Blueprint, request, jsonify, session
from database import get_db
from routes.decorators import login_required, role_required

water_bills_bp = Blueprint('')