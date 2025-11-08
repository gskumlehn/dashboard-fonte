import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(str(os.getenv("EMAIL_PORT")))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

class EmailManager:
    def __init__(self, smtp_server=EMAIL_HOST, smtp_port=EMAIL_PORT, sender_email=EMAIL_USER, sender_password=EMAIL_PASS):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.sender_email = sender_email
        self.sender_password = sender_password

    def send_email(self, recipients, subject, body, cc=None):
        if isinstance(recipients, str):
            to_list = [r.strip() for r in recipients.split(",") if r.strip()]
        else:
            to_list = list(recipients or [])

        if isinstance(cc, str):
            cc_list = [r.strip() for r in cc.split(",") if r.strip()]
        else:
            cc_list = list(cc or [])

        message = MIMEMultipart("alternative")
        message['From'] = self.sender_email
        message['To'] = ", ".join(to_list)
        if cc_list:
            message['Cc'] = ", ".join(cc_list)
        message['Subject'] = subject
        message.attach(MIMEText(body, 'html'))

        all_recipients = to_list + cc_list

        server = None
        try:
            server = smtplib.SMTP_SSL(self.smtp_server, self.smtp_port)
            server.login(self.sender_email, self.sender_password)
            server.send_message(message, from_addr=self.sender_email, to_addrs=all_recipients)
            print("E-mail enviado com sucesso!")
        except smtplib.SMTPServerDisconnected as e:
            print(f"Erro: Conexão com o servidor SMTP foi desconectada. Detalhes: {e}")
            raise
        except Exception as e:
            print(f"Erro ao enviar e-mail: {e}")
            raise
        finally:
            if server:
                try:
                    server.quit()
                except smtplib.SMTPServerDisconnected:
                    print("Servidor já desconectado.")
