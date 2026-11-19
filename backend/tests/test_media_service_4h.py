import uuid
import sys
import os
import io

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.role import Role
from app.models.classroom import Media
from app.services.media_service import MediaService, MediaServiceError
from flask_jwt_extended import create_access_token


def test_media_domain():
    print("=" * 70)
    print("      TEST SUITE 4H: MEDIA DOMAIN EXTRACTION & SECURITY CHECKS      ")
    print("=" * 70)

    app = create_app()
    with app.app_context():
        client = app.test_client()

        # Step 0: Identify test accounts
        super_admin = User.query.filter(User.roles.any(Role.role_name == "super_admin")).first()
        admin = User.query.filter(User.roles.any(Role.role_name == "admin")).filter(
            ~User.roles.any(Role.role_name == "super_admin")
        ).first()
        instructor = User.query.filter(User.roles.any(Role.role_name == "instructor")).first()
        student = User.query.filter(User.roles.any(Role.role_name == "student")).first()

        assert super_admin, "Super Admin user required in DB"
        assert admin, "Admin user required in DB"
        assert instructor, "Instructor user required in DB"
        assert student, "Student user required in DB"

        admin_token = create_access_token(identity=str(admin.user_id))
        inst_token = create_access_token(identity=str(instructor.user_id))
        student_token = create_access_token(identity=str(student.user_id))

        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        inst_headers = {"Authorization": f"Bearer {inst_token}"}
        student_headers = {"Authorization": f"Bearer {student_token}"}

        # ------------------------------------------------------------------
        # TEST 1: Unauthenticated (Guest) Access
        # ------------------------------------------------------------------
        print("\n[TEST 1] Testing Guest Access Control (Upload endpoint):")
        data = {"file": (io.BytesIO(b"dummy"), "test.mp4")}
        r = client.post("/api/v1/media/upload", data=data, content_type="multipart/form-data")
        assert r.status_code == 401, f"Expected 401 for guest upload, got {r.status_code}"
        print("  -> Guest upload blocked: HTTP 401 (PASS)")

        # ------------------------------------------------------------------
        # TEST 2: Student Access Control (Forbidden 403)
        # ------------------------------------------------------------------
        print("\n[TEST 2] Testing Student Access Control (Upload endpoint):")
        data = {"file": (io.BytesIO(b"dummy"), "test.mp4")}
        r = client.post("/api/v1/media/upload", headers=student_headers, data=data, content_type="multipart/form-data")
        assert r.status_code == 403, f"Expected 403 for student upload, got {r.status_code}"
        print("  -> Student upload blocked: HTTP 403 (PASS)")

        # ------------------------------------------------------------------
        # TEST 3: Instructor & Admin Upload Valid Files (MP4, PDF, PNG)
        # ------------------------------------------------------------------
        print("\n[TEST 3] Testing Valid File Uploads (Instructor & Admin):")
        
        # 3.1 MP4 Video
        dummy_mp4_bytes = b"\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2avc1mp41\x00\x00\x00\x08free" + b"A" * 1024
        data_mp4 = {"file": (io.BytesIO(dummy_mp4_bytes), "sample_video.mp4")}
        r_mp4 = client.post("/api/v1/media/upload", headers=inst_headers, data=data_mp4, content_type="multipart/form-data")
        assert r_mp4.status_code == 201, f"Expected 201, got {r_mp4.status_code}: {r_mp4.data}"
        json_mp4 = r_mp4.get_json()
        assert json_mp4["message"] == "อัปโหลดไฟล์สำเร็จ"
        assert "file_url" in json_mp4
        assert "relative_url" in json_mp4
        assert json_mp4["file_type"] == "video/mp4"
        assert json_mp4["file_size"] == len(dummy_mp4_bytes)
        assert json_mp4["stored_filename"].endswith(".mp4")
        assert json_mp4["media_id"] is not None
        mp4_filename = json_mp4["stored_filename"]
        print(f"  -> Instructor uploaded MP4 successfully: {json_mp4['stored_filename']} (PASS)")

        # 3.2 PDF Document
        dummy_pdf_bytes = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0>>endobj\nxref\n0 3\ntrailer<</Size 3/Root 1 0 R>>\nstartxref\n99\n%%EOF"
        data_pdf = {"file": (io.BytesIO(dummy_pdf_bytes), "sample_doc.pdf")}
        r_pdf = client.post("/api/v1/media/upload", headers=admin_headers, data=data_pdf, content_type="multipart/form-data")
        assert r_pdf.status_code == 201, f"Expected 201, got {r_pdf.status_code}: {r_pdf.data}"
        json_pdf = r_pdf.get_json()
        assert json_pdf["file_type"] == "application/pdf"
        assert json_pdf["file_size"] == len(dummy_pdf_bytes)
        pdf_filename = json_pdf["stored_filename"]
        print(f"  -> Admin uploaded PDF successfully: {json_pdf['stored_filename']} (PASS)")

        # 3.3 PNG Image
        dummy_png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"\x00" * 20
        data_png = {"file": (io.BytesIO(dummy_png_bytes), "thumbnail.png")}
        r_png = client.post("/api/v1/media/upload", headers=inst_headers, data=data_png, content_type="multipart/form-data")
        assert r_png.status_code == 201, f"Expected 201, got {r_png.status_code}"
        json_png = r_png.get_json()
        assert json_png["file_type"] == "image/png"
        print(f"  -> Instructor uploaded PNG successfully: {json_png['stored_filename']} (PASS)")

        # ------------------------------------------------------------------
        # TEST 4: Invalid File Types and Formats
        # ------------------------------------------------------------------
        print("\n[TEST 4] Testing Invalid File Type Rejection:")

        # Disallowed extension (.exe)
        data_exe = {"file": (io.BytesIO(b"MZ\x90\x00"), "malware.exe")}
        r_exe = client.post("/api/v1/media/upload", headers=inst_headers, data=data_exe, content_type="multipart/form-data")
        assert r_exe.status_code == 400
        assert "ประเภทไฟล์ไม่ถูกต้อง" in r_exe.get_json()["message"]
        print("  -> Rejected .exe file: HTTP 400 (PASS)")

        # Disallowed extension (.txt)
        data_txt = {"file": (io.BytesIO(b"hello text"), "notes.txt")}
        r_txt = client.post("/api/v1/media/upload", headers=inst_headers, data=data_txt, content_type="multipart/form-data")
        assert r_txt.status_code == 400
        print("  -> Rejected .txt file: HTTP 400 (PASS)")

        # File without extension
        data_no_ext = {"file": (io.BytesIO(b"no extension"), "noextension")}
        r_no_ext = client.post("/api/v1/media/upload", headers=inst_headers, data=data_no_ext, content_type="multipart/form-data")
        assert r_no_ext.status_code == 400
        print("  -> Rejected file without extension: HTTP 400 (PASS)")

        # Missing file field
        r_missing = client.post("/api/v1/media/upload", headers=inst_headers, data={}, content_type="multipart/form-data")
        assert r_missing.status_code == 400
        print("  -> Missing 'file' parameter rejected: HTTP 400 (PASS)")

        # ------------------------------------------------------------------
        # TEST 5: File Size Limits (Empty file & Oversized file)
        # ------------------------------------------------------------------
        print("\n[TEST 5] Testing File Size Validations:")

        # Empty file (0 bytes)
        data_empty = {"file": (io.BytesIO(b""), "empty.mp4")}
        r_empty = client.post("/api/v1/media/upload", headers=inst_headers, data=data_empty, content_type="multipart/form-data")
        assert r_empty.status_code == 400
        assert "0 ไบต์" in r_empty.get_json()["message"]
        print("  -> Empty 0-byte file rejected: HTTP 400 (PASS)")

        # Large file exceeding 50 MB limit
        class MockLargeStream(io.RawIOBase):
            def __init__(self, size):
                self._size = size
                self._pos = 0

            def seek(self, offset, whence=io.SEEK_SET):
                if whence == io.SEEK_SET:
                    self._pos = offset
                elif whence == io.SEEK_END:
                    self._pos = self._size + offset
                return self._pos

            def tell(self):
                return self._pos

            def read(self, size=-1):
                return b"X" * min(size, 1024)

        from werkzeug.datastructures import FileStorage
        large_storage = FileStorage(
            stream=MockLargeStream(51 * 1024 * 1024),
            filename="large_video.mp4",
            content_type="video/mp4"
        )
        try:
            MediaService.save_uploaded_file(large_storage, instructor, "http://localhost:5000")
            assert False, "Should have raised MediaServiceError for oversized file"
        except MediaServiceError as e:
            assert e.status_code == 400
            assert e.error == "Payload Too Large"
            print("  -> File exceeding 50MB rejected with 'Payload Too Large' (PASS)")

        # ------------------------------------------------------------------
        # TEST 6: Path Traversal Defenses in Upload
        # ------------------------------------------------------------------
        print("\n[TEST 6] Testing Path Traversal Defense in Upload Filename:")
        traversal_storage = FileStorage(
            stream=io.BytesIO(b"fake data"),
            filename="../../etc/passwd.mp4",
            content_type="video/mp4"
        )
        try:
            MediaService.save_uploaded_file(traversal_storage, instructor, "http://localhost:5000")
            assert False, "Should have raised MediaServiceError for traversal filename"
        except MediaServiceError as e:
            assert e.status_code == 400
            assert "ไม่ปลอดภัย" in e.message
            print("  -> Path traversal filename rejected: HTTP 400 (PASS)")

        # ------------------------------------------------------------------
        # TEST 7: Serve Uploaded File & HTTP Range Requests
        # ------------------------------------------------------------------
        print("\n[TEST 7] Testing File Serving & HTTP Range Requests:")
        
        # 7.1 Serve MP4
        r_serve = client.get(f"/api/v1/media/uploads/{mp4_filename}")
        assert r_serve.status_code == 200
        assert r_serve.headers.get("Content-Type") in ["video/mp4", "video/mp4; charset=utf-8"]
        print(f"  -> Served MP4 successfully: HTTP 200, Content-Type {r_serve.headers.get('Content-Type')} (PASS)")

        # 7.2 HTTP Range Request (HTTP 206 Partial Content)
        r_range = client.get(f"/api/v1/media/uploads/{mp4_filename}", headers={"Range": "bytes=10-50"})
        assert r_range.status_code == 206
        assert "bytes" in r_range.headers.get("Content-Range", "")
        assert len(r_range.data) == 41  # 50 - 10 + 1 = 41 bytes
        print(f"  -> HTTP Range Request (Seek): HTTP 206, Content-Range {r_range.headers.get('Content-Range')} (PASS)")

        # 7.3 Serve PDF
        r_pdf_serve = client.get(f"/api/v1/media/uploads/{pdf_filename}")
        assert r_pdf_serve.status_code == 200
        assert "application/pdf" in r_pdf_serve.headers.get("Content-Type")
        print(f"  -> Served PDF successfully: HTTP 200, Content-Type {r_pdf_serve.headers.get('Content-Type')} (PASS)")

        # ------------------------------------------------------------------
        # TEST 8: Path Traversal Defenses in Serve Endpoint
        # ------------------------------------------------------------------
        print("\n[TEST 8] Testing Path Traversal Defense in Serve Endpoint:")
        r_trav1 = client.get("/api/v1/media/uploads/..%2F..%2Fetc%2Fpasswd")
        # Flask routing or our handler rejects with 400/404
        assert r_trav1.status_code in [400, 404]
        print(f"  -> Directory traversal in URL blocked: HTTP {r_trav1.status_code} (PASS)")

        # Direct service resolution test for traversal
        try:
            MediaService.resolve_uploaded_file("../../../secret.txt")
            assert False, "Should have raised MediaServiceError for traversal"
        except MediaServiceError as e:
            assert e.status_code == 400
            print("  -> MediaService.resolve_uploaded_file traversal rejected with 400 (PASS)")

        # ------------------------------------------------------------------
        # TEST 9: Non-existent File (HTTP 404)
        # ------------------------------------------------------------------
        print("\n[TEST 9] Testing Non-existent File in Serve Endpoint:")
        r_404 = client.get("/api/v1/media/uploads/non_existent_file_xyz_12345.mp4")
        assert r_404.status_code == 404
        assert r_404.get_json()["error"] == "Not Found"
        print("  -> Non-existent file returned HTTP 404 (PASS)")

        # ------------------------------------------------------------------
        # TEST 10: Database Media Record Verification
        # ------------------------------------------------------------------
        print("\n[TEST 10] Testing Database Media Record Persistence:")
        media_rec = Media.query.filter_by(file_name="sample_video.mp4").order_by(Media.created_at.desc()).first()
        assert media_rec is not None
        assert media_rec.user_id == instructor.user_id
        assert media_rec.file_type == "video/mp4"
        assert media_rec.file_size == len(dummy_mp4_bytes)
        assert mp4_filename in media_rec.file_url
        print(f"  -> Media record persisted: media_id={media_rec.media_id}, user_id={media_rec.user_id} (PASS)")

    print("\n" + "=" * 70)
    print("      ALL MEDIA SERVICE (PHASE 4H) TESTS PASSED SUCCESSFULLY!      ")
    print("=" * 70)


if __name__ == "__main__":
    test_media_domain()
