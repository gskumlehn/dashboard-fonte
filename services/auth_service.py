import os
import hmac
from werkzeug.security import check_password_hash

class AuthService:
    @staticmethod
    def validate_credentials(username: str, password: str) -> bool:
        env_user = os.getenv("APP_USER")
        env_hash = os.getenv("APP_PASSWORD_HASH")
        if not env_user or not env_hash:
            return False

        user_ok = hmac.compare_digest(username, env_user)
        pass_ok = check_password_hash(env_hash, password)

        return user_ok and pass_ok