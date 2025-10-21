import os
from werkzeug.security import check_password_hash
import hmac

class AuthService:
    @staticmethod
    def validate_credentials(username: str, password: str):
        env_user = os.getenv("APP_USER")
        env_hash = os.getenv("APP_PASSWORD_HASH")

        if not env_user or not env_hash:
            raise Exception("Application not configured")

        if hmac.compare_digest(username, env_user) and check_password_hash(env_hash, password):
            return True

        raise Exception("Invalid username or password")

