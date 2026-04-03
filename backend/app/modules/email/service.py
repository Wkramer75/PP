import smtplib
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from collections import Counter

from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func

from app.modules.email.models import EmailTemplate, EmailCampaign, EmailRecipient
from app.modules.crm.models import Prospect


def _render_template(html: str, variables: dict) -> str:
    """Replace {{variable}} placeholders with actual values."""
    for key, value in variables.items():
        html = html.replace("{{" + key + "}}", str(value or ""))
    # Remove any remaining unreplaced variables
    html = re.sub(r"\{\{[a-zA-Z_]+\}\}", "", html)
    return html


def _send_email(smtp_host: str, smtp_port: int, smtp_user: str, smtp_password: str,
                from_name: str, from_email: str, to_email: str,
                subject: str, body_html: str, body_text: str | None = None):
    """Send a single email via SMTP."""
    msg = MIMEMultipart("alternative")
    msg["From"] = f"{from_name} <{from_email}>" if from_name else from_email
    msg["To"] = to_email
    msg["Subject"] = subject

    if body_text:
        msg.attach(MIMEText(body_text, "plain"))
    msg.attach(MIMEText(body_html, "html"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)


# ── Templates ─────────────────────────────────────────────────────────────────

def create_template(db: Session, data: dict) -> EmailTemplate:
    template = EmailTemplate(**data)
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def update_template(db: Session, template_id: int, data: dict) -> EmailTemplate | None:
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(template, key, value)
    db.commit()
    db.refresh(template)
    return template


def delete_template(db: Session, template_id: int) -> bool:
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        return False
    db.delete(template)
    db.commit()
    return True


def get_template(db: Session, template_id: int) -> EmailTemplate | None:
    return db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()


def list_templates(db: Session, skip: int = 0, limit: int = 50) -> list[EmailTemplate]:
    return db.query(EmailTemplate).order_by(EmailTemplate.created_at.desc()).offset(skip).limit(limit).all()


# ── Campaigns ─────────────────────────────────────────────────────────────────

def create_campaign(db: Session, data: dict) -> EmailCampaign:
    campaign = EmailCampaign(**data)
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


def get_campaign(db: Session, campaign_id: int) -> EmailCampaign | None:
    return db.query(EmailCampaign).filter(EmailCampaign.id == campaign_id).first()


def list_campaigns(db: Session, skip: int = 0, limit: int = 50) -> list[EmailCampaign]:
    return db.query(EmailCampaign).order_by(EmailCampaign.created_at.desc()).offset(skip).limit(limit).all()


def delete_campaign(db: Session, campaign_id: int) -> bool:
    campaign = db.query(EmailCampaign).filter(EmailCampaign.id == campaign_id).first()
    if not campaign:
        return False
    db.query(EmailRecipient).filter(EmailRecipient.campaign_id == campaign_id).delete()
    db.delete(campaign)
    db.commit()
    return True


def add_recipients_from_prospects(db: Session, campaign_id: int, prospect_ids: list[int]) -> list[EmailRecipient]:
    campaign = db.query(EmailCampaign).filter(EmailCampaign.id == campaign_id).first()
    if not campaign:
        raise ValueError("Campaign not found")

    created = []
    for pid in prospect_ids:
        prospect = db.query(Prospect).filter(Prospect.id == pid).first()
        if not prospect or not prospect.email:
            continue
        existing = db.query(EmailRecipient).filter(
            EmailRecipient.campaign_id == campaign_id,
            EmailRecipient.email == prospect.email,
        ).first()
        if existing:
            continue
        recipient = EmailRecipient(
            campaign_id=campaign_id,
            prospect_id=prospect.id,
            email=prospect.email,
            name=f"{prospect.first_name or ''} {prospect.last_name or ''}".strip() or None,
            variables={
                "first_name": prospect.first_name or "",
                "last_name": prospect.last_name or "",
                "company": prospect.company or "",
                "email": prospect.email,
                "job_title": prospect.job_title or "",
            },
        )
        db.add(recipient)
        created.append(recipient)

    campaign.total_recipients = db.query(EmailRecipient).filter(
        EmailRecipient.campaign_id == campaign_id
    ).count()
    db.commit()
    for r in created:
        db.refresh(r)
    return created


def add_recipients_from_emails(db: Session, campaign_id: int, emails: list[str]) -> list[EmailRecipient]:
    campaign = db.query(EmailCampaign).filter(EmailCampaign.id == campaign_id).first()
    if not campaign:
        raise ValueError("Campaign not found")

    created = []
    for email in emails:
        existing = db.query(EmailRecipient).filter(
            EmailRecipient.campaign_id == campaign_id,
            EmailRecipient.email == email,
        ).first()
        if existing:
            continue
        recipient = EmailRecipient(
            campaign_id=campaign_id,
            email=email,
            variables={"email": email},
        )
        db.add(recipient)
        created.append(recipient)

    campaign.total_recipients = db.query(EmailRecipient).filter(
        EmailRecipient.campaign_id == campaign_id
    ).count()
    db.commit()
    for r in created:
        db.refresh(r)
    return created


def get_recipients(db: Session, campaign_id: int) -> list[EmailRecipient]:
    return (
        db.query(EmailRecipient)
        .filter(EmailRecipient.campaign_id == campaign_id)
        .order_by(EmailRecipient.created_at)
        .all()
    )


def send_campaign(db: Session, campaign_id: int) -> EmailCampaign:
    """Send all pending emails in a campaign."""
    campaign = db.query(EmailCampaign).filter(EmailCampaign.id == campaign_id).first()
    if not campaign:
        raise ValueError("Campaign not found")
    if not campaign.smtp_user or not campaign.smtp_password:
        raise ValueError("SMTP credentials not configured")

    template = db.query(EmailTemplate).filter(EmailTemplate.id == campaign.template_id).first()
    if not template:
        raise ValueError("Template not found")

    recipients = db.query(EmailRecipient).filter(
        EmailRecipient.campaign_id == campaign_id,
        EmailRecipient.status == "pending",
    ).all()

    campaign.status = "sending"
    db.commit()

    subject = campaign.subject_override or template.subject
    from_email = campaign.from_email or campaign.smtp_user
    from_name = campaign.from_name or "Sales Prospecting Tool"

    for recipient in recipients:
        try:
            rendered_subject = _render_template(subject, recipient.variables or {})
            rendered_body = _render_template(template.body_html, recipient.variables or {})
            rendered_text = _render_template(template.body_text, recipient.variables or {}) if template.body_text else None

            _send_email(
                campaign.smtp_host, campaign.smtp_port,
                campaign.smtp_user, campaign.smtp_password,
                from_name, from_email,
                recipient.email, rendered_subject, rendered_body, rendered_text,
            )
            recipient.status = "sent"
            recipient.sent_at = sa_func.now()
            campaign.sent_count += 1
        except Exception as e:
            recipient.status = "failed"
            recipient.error_message = str(e)[:500]
            campaign.failed_count += 1

        db.commit()

    campaign.status = "sent"
    campaign.sent_at = sa_func.now()
    db.commit()
    db.refresh(campaign)
    return campaign


def send_test_email(db: Session, template_id: int, to_email: str, variables: dict,
                    smtp_host: str, smtp_port: int, smtp_user: str, smtp_password: str,
                    from_name: str | None, from_email: str | None) -> bool:
    """Send a single test email."""
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise ValueError("Template not found")

    rendered_subject = _render_template(template.subject, variables)
    rendered_body = _render_template(template.body_html, variables)
    rendered_text = _render_template(template.body_text, variables) if template.body_text else None

    _send_email(
        smtp_host, smtp_port, smtp_user, smtp_password,
        from_name or "Test", from_email or smtp_user,
        to_email, rendered_subject, rendered_body, rendered_text,
    )
    return True


def get_email_stats(db: Session) -> dict:
    total_templates = db.query(EmailTemplate).count()
    total_campaigns = db.query(EmailCampaign).count()

    campaigns = db.query(EmailCampaign).all()
    total_sent = sum(c.sent_count for c in campaigns)
    total_failed = sum(c.failed_count for c in campaigns)
    status_counts = Counter(c.status for c in campaigns)

    return {
        "total_templates": total_templates,
        "total_campaigns": total_campaigns,
        "total_sent": total_sent,
        "total_failed": total_failed,
        "campaigns_by_status": dict(status_counts),
    }
