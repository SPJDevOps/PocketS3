from fastapi import FastAPI, UploadFile, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
import boto3, os, tempfile
from botocore.exceptions import ClientError
from typing import Optional

app = FastAPI()

# Allow frontend to call backend (during dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# S3 client setup
s3 = boto3.client(
    "s3",
    endpoint_url=os.environ.get("S3_ENDPOINT"),
    aws_access_key_id=os.environ.get("S3_ACCESS_KEY"),
    aws_secret_access_key=os.environ.get("S3_SECRET_KEY"),
)


@app.get("/api/buckets")
def list_buckets():
    """List all available S3 buckets"""
    try:
        buckets = s3.list_buckets()["Buckets"]
        return [
            {"name": b["Name"], "creationDate": b["CreationDate"].isoformat()}
            for b in buckets
        ]
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Failed to list buckets: {str(e)}")


@app.get("/api/buckets/{bucket}/objects")
def list_objects(
    bucket: str, prefix: Optional[str] = Query(None), delimiter: str = Query("/")
):
    """List objects in a bucket with optional prefix (folder) filtering"""
    try:
        params = {"Bucket": bucket, "Delimiter": delimiter}
        if prefix:
            params["Prefix"] = prefix

        # Handle pagination
        all_contents = []
        all_prefixes = []
        continuation_token = None

        while True:
            if continuation_token:
                params["ContinuationToken"] = continuation_token

            resp = s3.list_objects_v2(**params)

            # Files in current directory
            if "Contents" in resp:
                all_contents.extend(resp["Contents"])

            # Subdirectories (common prefixes)
            if "CommonPrefixes" in resp:
                all_prefixes.extend(resp["CommonPrefixes"])

            if not resp.get("IsTruncated"):
                break

            continuation_token = resp.get("NextContinuationToken")

        # Format response
        files = []
        for obj in all_contents:
            # Skip the prefix itself if it's a folder marker
            if obj["Key"] == prefix:
                continue
            files.append(
                {
                    "key": obj["Key"],
                    "size": obj["Size"],
                    "lastModified": obj["LastModified"].isoformat(),
                    "type": "file",
                }
            )

        folders = []
        for prefix_obj in all_prefixes:
            folders.append({"key": prefix_obj["Prefix"], "type": "folder"})

        return {"files": files, "folders": folders}
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Failed to list objects: {str(e)}")


@app.get("/api/buckets/{bucket}/tree")
def get_folder_tree(bucket: str):
    """Get the complete folder structure for tree navigation"""
    try:
        # List all objects to build tree structure
        all_objects = []
        continuation_token = None

        while True:
            params = {"Bucket": bucket}
            if continuation_token:
                params["ContinuationToken"] = continuation_token

            resp = s3.list_objects_v2(**params)

            if "Contents" in resp:
                all_objects.extend([obj["Key"] for obj in resp["Contents"]])

            if not resp.get("IsTruncated"):
                break

            continuation_token = resp.get("NextContinuationToken")

        # Build folder structure
        folders = set()
        for key in all_objects:
            parts = key.split("/")
            # Build all prefix paths
            for i in range(len(parts) - 1):
                folder_path = "/".join(parts[: i + 1]) + "/"
                folders.add(folder_path)

        # Convert to hierarchical structure
        tree = []
        folder_list = sorted(folders)

        for folder in folder_list:
            parts = folder.rstrip("/").split("/")
            tree.append({"path": folder, "name": parts[-1], "level": len(parts)})

        return {"folders": tree}
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get folder tree: {str(e)}"
        )


@app.post("/api/buckets/{bucket}/upload")
async def upload_file(
    bucket: str, file: UploadFile, prefix: Optional[str] = Form(None)
):
    """Upload a file to S3 bucket with optional prefix (folder path)"""
    try:
        key = file.filename
        if prefix:
            # Ensure prefix ends with /
            prefix = prefix.rstrip("/") + "/"
            key = prefix + file.filename

        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp.flush()
            tmp_path = tmp.name

        try:
            s3.upload_file(tmp_path, bucket, key)
        finally:
            os.unlink(tmp_path)

        return {"message": "File uploaded successfully", "key": key}
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")


@app.post("/api/buckets/{bucket}/folder")
async def create_folder(bucket: str, prefix: str = Form(...)):
    """Create a folder (empty object with trailing slash)"""
    try:
        # Ensure prefix ends with /
        if not prefix.endswith("/"):
            prefix = prefix + "/"

        # Create empty object to represent folder
        s3.put_object(Bucket=bucket, Key=prefix, Body=b"")

        return {"message": "Folder created successfully", "key": prefix}
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create folder: {str(e)}"
        )


@app.get("/api/buckets/{bucket}/download/{key:path}")
def download_file(bucket: str, key: str):
    """Download a file from S3 bucket"""
    try:
        # Get object from S3
        response = s3.get_object(Bucket=bucket, Key=key)

        # Extract filename from key
        filename = key.split("/")[-1]

        # Stream the file content
        return StreamingResponse(
            response["Body"].iter_chunks(),
            media_type=response.get("ContentType", "application/octet-stream"),
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            raise HTTPException(status_code=404, detail="File not found")
        raise HTTPException(
            status_code=500, detail=f"Failed to download file: {str(e)}"
        )


@app.delete("/api/buckets/{bucket}/objects/{key:path}")
def delete_object(bucket: str, key: str):
    """Delete an object or folder from S3 bucket"""
    try:
        # If it's a folder (ends with /), delete all objects with that prefix
        if key.endswith("/"):
            # List all objects with this prefix
            objects_to_delete = []
            continuation_token = None

            while True:
                params = {"Bucket": bucket, "Prefix": key}
                if continuation_token:
                    params["ContinuationToken"] = continuation_token

                resp = s3.list_objects_v2(**params)

                if "Contents" in resp:
                    objects_to_delete.extend(
                        [{"Key": obj["Key"]} for obj in resp["Contents"]]
                    )

                if not resp.get("IsTruncated"):
                    break

                continuation_token = resp.get("NextContinuationToken")

            # Delete all objects in folder
            if objects_to_delete:
                s3.delete_objects(Bucket=bucket, Delete={"Objects": objects_to_delete})

            return {
                "message": f"Folder deleted successfully",
                "deleted": len(objects_to_delete),
            }
        else:
            # Single file deletion
            s3.delete_object(Bucket=bucket, Key=key)
            return {"message": "File deleted successfully"}
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete object: {str(e)}"
        )


# Serve built React app
app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")
