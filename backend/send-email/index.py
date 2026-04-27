import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def handler(event: dict, context) -> dict:
    """Отправка заявки с сайта на почту no2122@mail.ru через SMTP Mail.ru"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    body = json.loads(event.get('body', '{}'))
    name = body.get('name', '')
    phone = body.get('phone', '')
    checkin = body.get('checkin', '')
    checkout = body.get('checkout', '')
    guests = body.get('guests', '')

    smtp_user = os.environ['MAIL_SMTP_USER']
    smtp_password = os.environ['MAIL_SMTP_PASSWORD']
    recipient = 'no2122@mail.ru'

    html_body = f"""
    <h2>Новая заявка с сайта — Рейд Паллада</h2>
    <table style="border-collapse: collapse; font-size: 16px;">
        <tr><td style="padding: 6px 12px; font-weight: bold;">Имя:</td><td style="padding: 6px 12px;">{name}</td></tr>
        <tr><td style="padding: 6px 12px; font-weight: bold;">Телефон / Telegram:</td><td style="padding: 6px 12px;">{phone}</td></tr>
        <tr><td style="padding: 6px 12px; font-weight: bold;">Дата заезда:</td><td style="padding: 6px 12px;">{checkin}</td></tr>
        <tr><td style="padding: 6px 12px; font-weight: bold;">Дата выезда:</td><td style="padding: 6px 12px;">{checkout}</td></tr>
        <tr><td style="padding: 6px 12px; font-weight: bold;">Гости и пожелания:</td><td style="padding: 6px 12px;">{guests}</td></tr>
    </table>
    """

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Заявка с сайта: {name}'
    msg['From'] = smtp_user
    msg['To'] = recipient
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    with smtplib.SMTP_SSL('smtp.mail.ru', 465) as server:
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, recipient, msg.as_string())

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True})
    }
