from fastapi import FastAPI, UploadFile, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
import aioboto3
import os, tempfile
from botocore.exceptions import ClientError
from typing import Optional


# Lifespan context manager for S3 session
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize aioboto3 session
    session_kwargs = {
        "aws_access_key_id": os.environ.get("S3_ACCESS_KEY"),
        "aws_secret_access_key": os.environ.get("S3_SECRET_KEY"),
    }
    
    # Only add region_name if it's a valid non-empty string
    region = os.environ.get("S3_REGION")
    if region and region.strip():
        session_kwargs["region_name"] = region
    
    session = aioboto3.Session(**session_kwargs)
    app.state.session = session
    app.state.s3_endpoint = os.environ.get("S3_ENDPOINT") or None
    yield
    # Shutdown: cleanup if needed
    app.state.session = None


app = FastAPI(lifespan=lifespan)

# Allow frontend to call backend (during dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Helper to get S3 client
@asynccontextmanager
async def get_s3_client():
    async with app.state.session.client(
        "s3",
        endpoint_url=app.state.s3_endpoint,
    ) as client:
        yield client


@app.get("/api/buckets")
async def list_buckets():
    """List all available S3 buckets"""
    try:
        async with get_s3_client() as s3:
            response = await s3.list_buckets()
            buckets = response["Buckets"]
            return [
                {"name": b["Name"], "creationDate": b["CreationDate"].isoformat()}
                for b in buckets
            ]
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Failed to list buckets: {str(e)}")


@app.post("/api/buckets")
async def create_bucket(
    bucket_name: str = Form(...), region: Optional[str] = Form(None)
):
    """Create a new S3 bucket with optional region"""
    try:
        async with get_s3_client() as s3:
            params = {"Bucket": bucket_name}

            # Add region-specific configuration if provided
            if region and region != os.environ.get("S3_REGION"):
                params["CreateBucketConfiguration"] = {"LocationConstraint": region}

            await s3.create_bucket(**params)
            return {"message": "Bucket created successfully", "name": bucket_name}
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create bucket: {str(e)}"
        )


@app.get("/api/buckets/{bucket}/objects")
async def list_objects(
    bucket: str, prefix: Optional[str] = Query(None), delimiter: str = Query("/")
):
    """List objects in a bucket with optional prefix (folder) filtering"""
    try:
        async with get_s3_client() as s3:
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

                resp = await s3.list_objects_v2(**params)

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
async def get_folder_tree(bucket: str):
    """Get the complete folder structure for tree navigation"""
    try:
        async with get_s3_client() as s3:
            # List all objects to build tree structure
            all_objects = []
            continuation_token = None

            while True:
                params = {"Bucket": bucket}
                if continuation_token:
                    params["ContinuationToken"] = continuation_token

                resp = await s3.list_objects_v2(**params)

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
        async with get_s3_client() as s3:
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
                await s3.upload_file(tmp_path, bucket, key)
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
        async with get_s3_client() as s3:
            # Ensure prefix ends with /
            if not prefix.endswith("/"):
                prefix = prefix + "/"

            # Create empty object to represent folder
            await s3.put_object(Bucket=bucket, Key=prefix, Body=b"")

            return {"message": "Folder created successfully", "key": prefix}
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create folder: {str(e)}"
        )


@app.get("/api/buckets/{bucket}/download/{key:path}")
async def download_file(bucket: str, key: str):
    """Download a file from S3 bucket"""
    try:
        async with get_s3_client() as s3:
            # Get object from S3
            response = await s3.get_object(Bucket=bucket, Key=key)

            # Extract filename from key
            filename = key.split("/")[-1]
            
            # Read all content from the response body before the context manager closes
            content = await response["Body"].read()

            # Create a generator that yields the content
            def stream_content():
                yield content

            # Stream the file content
            return StreamingResponse(
                stream_content(),
                media_type=response.get("ContentType", "application/octet-stream"),
                headers={"Content-Disposition": f'attachment; filename="{filename}"'},
            )
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            raise HTTPException(status_code=404, detail="File not found")
        raise HTTPException(
            status_code=500, detail=f"Failed to download file: {str(e)}"
        )


@app.get("/api/buckets/{bucket}/search")
async def search_objects(bucket: str, query: str = Query(...)):
    """Search for objects in a bucket by key name (case-insensitive)"""
    try:
        if not query or not query.strip():
            return {"files": [], "folders": []}

        async with get_s3_client() as s3:
            query_lower = query.lower().strip()

            # List all objects in the bucket
            all_objects = []
            continuation_token = None

            while True:
                params = {"Bucket": bucket}
                if continuation_token:
                    params["ContinuationToken"] = continuation_token

                resp = await s3.list_objects_v2(**params)

                if "Contents" in resp:
                    all_objects.extend(resp["Contents"])

                if not resp.get("IsTruncated"):
                    break

                continuation_token = resp.get("NextContinuationToken")

            # Filter objects that match the query
            matched_files = []
            matched_folders = set()

            for obj in all_objects:
                key = obj["Key"]

                # Skip folder markers (keys ending with /)
                if key.endswith("/"):
                    # This is a folder marker, add to folders if it matches
                    if query_lower in key.lower():
                        matched_folders.add(key)
                else:
                    # This is a file, check if it matches
                    if query_lower in key.lower():
                        matched_files.append(
                            {
                                "key": key,
                                "size": obj["Size"],
                                "lastModified": obj["LastModified"].isoformat(),
                                "type": "file",
                            }
                        )

            # Convert folders to list format
            folders = [
                {"key": folder, "type": "folder"} for folder in sorted(matched_folders)
            ]

            return {"files": matched_files, "folders": folders}
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to search objects: {str(e)}"
        )


@app.delete("/api/buckets/{bucket}/objects/{key:path}")
async def delete_object(bucket: str, key: str):
    """Delete an object or folder from S3 bucket"""
    try:
        async with get_s3_client() as s3:
            # If it's a folder (ends with /), delete all objects with that prefix
            if key.endswith("/"):
                # List all objects with this prefix
                objects_to_delete = []
                continuation_token = None

                while True:
                    params = {"Bucket": bucket, "Prefix": key}
                    if continuation_token:
                        params["ContinuationToken"] = continuation_token

                    resp = await s3.list_objects_v2(**params)

                    if "Contents" in resp:
                        objects_to_delete.extend(
                            [{"Key": obj["Key"]} for obj in resp["Contents"]]
                        )

                    if not resp.get("IsTruncated"):
                        break

                    continuation_token = resp.get("NextContinuationToken")

                # Delete all objects in folder
                if objects_to_delete:
                    await s3.delete_objects(
                        Bucket=bucket, Delete={"Objects": objects_to_delete}
                    )

                return {
                    "message": f"Folder deleted successfully",
                    "deleted": len(objects_to_delete),
                }
            else:
                # Single file deletion
                await s3.delete_object(Bucket=bucket, Key=key)
                return {"message": "File deleted successfully"}
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete object: {str(e)}"
        )


# Serve built React app
app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")
