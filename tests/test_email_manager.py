import unittest
from app.infra.email_manager import EmailManager

class TestEmailManager(unittest.TestCase):
    def setUp(self):
        self.email_manager = EmailManager()

    def test_send_email(self):
        recipients = "gskumlehn@gmail.com"
        subject = "Test Email"
        body = "<h1>This is a test email</h1><p>Sent from EmailManager test case.</p>"

        try:
            self.email_manager.send_email(recipients, subject, body)
            print("Test email sent successfully.")
        except Exception as e:
            self.fail(f"Email sending failed with error: {e}")

if __name__ == "__main__":
    unittest.main()
