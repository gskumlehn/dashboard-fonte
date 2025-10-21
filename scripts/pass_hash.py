from getpass import getpass
from werkzeug.security import generate_password_hash

def main():
    senha = getpass("Digite a senha a ser hasheada: ")
    hash_senha = generate_password_hash(senha)
    print("\nHash gerado (cole em `APP_PASSWORD_HASH` no ` .env`):\n")
    print(hash_senha)

if __name__ == "__main__":
    main()
