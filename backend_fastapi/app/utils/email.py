import os
import smtplib
from email.mime.text import MIMEText
from typing import List, Optional

# Leer flags y configuración desde .env (alineado con backend .env)
# Activación: usa NOTIFY_ABSENCES_ENABLED como principal; EMAIL_ENABLED opcional
EMAIL_ENABLED = os.getenv("NOTIFY_ABSENCES_ENABLED", os.getenv("EMAIL_ENABLED", "false")).lower() == "true"
SMTP_HOST = os.getenv("EMAIL_HOST", os.getenv("SMTP_HOST", "127.0.0.1"))
SMTP_PORT = int(os.getenv("EMAIL_PORT", os.getenv("SMTP_PORT", "1025")))  # MailHog por defecto
SMTP_USER = os.getenv("EMAIL_USER", os.getenv("SMTP_USER", ""))
SMTP_PASSWORD = os.getenv("EMAIL_PASSWORD", os.getenv("SMTP_PASSWORD", ""))
EMAIL_FROM = os.getenv("EMAIL_FROM", "Sistema Académico <no-reply@local.test>")

class OutgoingEmail:
    def __init__(self, to: List[str], subject: str, body: str):
        self.to = to
        self.subject = subject
        self.body = body

    def as_mime(self) -> MIMEText:
        msg = MIMEText(self.body, _charset="utf-8")
        msg["Subject"] = self.subject
        msg["From"] = EMAIL_FROM
        msg["To"] = ", ".join(self.to)
        return msg

def send_email(email: OutgoingEmail) -> bool:
    """Send email if EMAIL_ENABLED, else return False (dry). Never raises.
    Logs basic diagnostics to help troubleshoot in development.
    """
    if not EMAIL_ENABLED:
        print("[email] disabled; not sending")
        return False
    try:
        print(f"[email] connecting smtp={SMTP_HOST}:{SMTP_PORT} from={EMAIL_FROM} to={email.to}")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            # Solo iniciar TLS si hay usuario configurado y puerto típico
            if SMTP_USER:
                try:
                    server.starttls()
                    print("[email] starttls OK")
                except Exception as e:
                    print(f"[email] starttls failed: {e}")
                try:
                    server.login(SMTP_USER, SMTP_PASSWORD)
                    print("[email] login OK")
                except Exception as e:
                    print(f"[email] login failed: {e}")
            server.send_message(email.as_mime())
        print("[email] sent OK")
        return True
    except Exception as e:
        print(f"[email] send failed: {e}")
        return False

# Helper to describe current config state
def email_status() -> dict:
    return {
        "enabled": EMAIL_ENABLED,
        "host": SMTP_HOST,
        "port": SMTP_PORT,
        "from": EMAIL_FROM,
        "auth": bool(SMTP_USER)
    }
