from pathlib import Path
from uuid import uuid4


def save_file(upload_dir: Path, content: bytes, extension: str) -> str:
    upload_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"
    (upload_dir / filename).write_bytes(content)
    return f"/uploads/{filename}"


def delete_file(upload_dir: Path, file_path: str) -> None:
    filename = Path(file_path).name
    if filename:
        (upload_dir / filename).unlink(missing_ok=True)