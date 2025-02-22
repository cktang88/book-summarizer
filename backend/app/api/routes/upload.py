from fastapi import APIRouter, UploadFile, HTTPException
from ...utils.storage import save_upload_file

router = APIRouter()


@router.post("/upload")
async def upload_file(file: UploadFile):
    try:
        if not file.filename:
            raise ValueError("No filename provided")

        file_id, file_path = await save_upload_file(file)

        return {
            "id": file_id,
            "url": f"/books/{file_path.name}",  # URL where the file can be accessed
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to upload file")
