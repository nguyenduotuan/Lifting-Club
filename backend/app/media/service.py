from dataclasses import dataclass

from fastapi import HTTPException, UploadFile

from app.config.settings import settings
from app.media.storage import save_file


SUPPORTED_TYPES = {
    "image/jpeg": ("image", ".jpg"),
    "image/png": ("image", ".png"),
    "image/webp": ("image", ".webp"),
    "image/gif": ("image", ".gif"),
    "video/mp4": ("video", ".mp4"),
    "video/webm": ("video", ".webm"),
    "video/quicktime": ("video", ".mov"),
}


@dataclass
class StoredMedia:
    file_path: str
    media_type: str


async def store_upload(upload: UploadFile) -> StoredMedia:
    media_details = SUPPORTED_TYPES.get((upload.content_type or "").lower())
    if media_details is None:
        raise HTTPException(status_code=422, detail="Only supported image and video files can be uploaded.")

    content = await upload.read(settings.max_upload_size_bytes + 1)
    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(status_code=413, detail="Each uploaded file must be 25 MB or smaller.")

    media_type, extension = media_details
    file_path = save_file(settings.upload_dir, content, extension)
    return StoredMedia(file_path=file_path, media_type=media_type)