import json
import os
import uuid
import base64
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p1777038_raider_pallada")
UPLOAD_PASSWORD = os.environ.get("GALLERY_PASSWORD", "морской2026")
VALID_CATEGORIES = ["sea", "basic", "comfort", "family"]

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Gallery-Password",
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Галерея домиков: получение (GET ?category=sea), загрузка (POST), удаление (DELETE)"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")

    if method == "GET":
        params = event.get("queryStringParameters") or {}
        category = params.get("category", "sea")
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, url, media_type, thumbnail, created_at FROM {SCHEMA}.sea_gallery WHERE category = %s ORDER BY created_at DESC",
            (category,)
        )
        rows = cur.fetchall()
        conn.close()
        photos = [{"id": r[0], "url": r[1], "media_type": r[2] or "photo", "thumbnail": r[3], "created_at": str(r[4])} for r in rows]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"photos": photos})}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        password = body.get("password", "")
        if password != UPLOAD_PASSWORD:
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Неверный пароль"})}

        category = body.get("category", "sea")

        # Если передан готовый URL — просто сохраняем в БД
        ready_url = body.get("url")
        if ready_url:
            media_type = "video" if ready_url.endswith((".mp4", ".mov", ".webm")) else "photo"
            thumbnail = body.get("thumbnail")
            conn = get_db()
            cur = conn.cursor()
            cur.execute(f"INSERT INTO {SCHEMA}.sea_gallery (url, media_type, thumbnail, category) VALUES (%s, %s, %s, %s) RETURNING id", (ready_url, media_type, thumbnail, category))
            new_id = cur.fetchone()[0]
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": new_id, "url": ready_url, "media_type": media_type, "thumbnail": thumbnail})}

        file_b64 = body.get("image")
        content_type = body.get("content_type", "image/jpeg")
        if not file_b64:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нет файла"})}

        is_video = content_type.startswith("video/")
        media_type = "video" if is_video else "photo"
        if "jpeg" in content_type:
            ext = "jpg"
        elif content_type == "video/quicktime":
            ext = "mov"
        else:
            ext = content_type.split("/")[-1]
        key = f"gallery/{category}/{uuid.uuid4()}.{ext}"
        data = base64.b64decode(file_b64)

        import boto3
        s3 = boto3.client("s3", endpoint_url="https://bucket.poehali.dev",
                          aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
                          aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"])
        s3.put_object(Bucket="files", Key=key, Body=data, ContentType=content_type)
        url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

        conn = get_db()
        cur = conn.cursor()
        cur.execute(f"INSERT INTO {SCHEMA}.sea_gallery (url, media_type, category) VALUES (%s, %s, %s) RETURNING id", (url, media_type, category))
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": new_id, "url": url, "media_type": media_type})}

    if method == "PATCH":
        body = json.loads(event.get("body") or "{}")
        password = body.get("password", "")
        if password != UPLOAD_PASSWORD:
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Неверный пароль"})}
        photo_id = body.get("id")
        thumbnail = body.get("thumbnail")
        conn = get_db()
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.sea_gallery SET thumbnail = %s WHERE id = %s", (thumbnail, photo_id))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    if method == "DELETE":
        body = json.loads(event.get("body") or "{}")
        password = body.get("password", "")
        if password != UPLOAD_PASSWORD:
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Неверный пароль"})}
        photo_id = body.get("id")
        conn = get_db()
        cur = conn.cursor()
        cur.execute(f"DELETE FROM {SCHEMA}.sea_gallery WHERE id = %s", (photo_id,))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}
