import os

class AuthService:
    @staticmethod
    def validate_credentials(username: str, password: str):
        env_user = os.getenv("APP_USER")
        env_password = os.getenv("APP_PASSWORD")

        if username == env_user and password == env_password:
            return True

        raise Exception("Invalid username or password")
