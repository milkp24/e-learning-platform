import urllib.request
import urllib.error
import json
import os
import io
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


BASE_URL = "http://127.0.0.1:5000/api/v1"

def login(email, password):
    data = json.dumps({"email": email, "password": password}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/auth/login", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        body = json.loads(resp.read().decode("utf-8"))
        return body.get("access_token")

def upload_multipart(token, filename, content_bytes, mime_type):
    boundary = "----WebKitFormBoundaryUAT021Test12345"
    body = io.BytesIO()
    body.write(f"--{boundary}\r\n".encode("utf-8"))
    body.write(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode("utf-8"))
    body.write(f"Content-Type: {mime_type}\r\n\r\n".encode("utf-8"))
    body.write(content_bytes)
    body.write(f"\r\n--{boundary}--\r\n".encode("utf-8"))
    
    payload = body.getvalue()
    headers = {
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Content-Length": str(len(payload))
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    req = urllib.request.Request(f"{BASE_URL}/media/upload", data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8")
        try:
            parsed = json.loads(body_text)
        except Exception:
            parsed = {"raw": body_text}
        return e.code, parsed

def run_tests():
    print("=== STARTING UAT-021 MEDIA UPLOAD TEST SUITE ===")
    
    # 0. Prepare tokens
    instructor_token = login("instructor@test.com", "Password123")
    student_token = login("student@test.com", "Password123")
    admin_token = login("superadmin@test.com", "SuperAdmin@123")
    
    results = {}
    
    # Test 1: Upload MP4 (Instructor)
    dummy_mp4_bytes = b"\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2avc1mp41\x00\x00\x00\x08free" + b"A" * 1024
    s1, r1 = upload_multipart(instructor_token, "test_lesson_video.mp4", dummy_mp4_bytes, "video/mp4")
    print(f"Test 1 - Upload MP4: Status {s1}, File URL: {r1.get('file_url')}")
    results["1. Upload MP4"] = "PASS" if s1 == 201 and "file_url" in r1 else f"FAIL ({s1})"
    mp4_url = r1.get("file_url")
    
    # Test 2: Open Video after upload (GET video URL)
    if mp4_url:
        req = urllib.request.Request(mp4_url)
        with urllib.request.urlopen(req) as v_resp:
            results["2. Open Video"] = "PASS" if v_resp.status == 200 and v_resp.headers.get("Content-Type") == "video/mp4" else f"FAIL ({v_resp.status})"
            print(f"Test 2 - Open Video: Status {v_resp.status}, Content-Type {v_resp.headers.get('Content-Type')}")
    else:
        results["2. Open Video"] = "FAIL (No URL)"
        
    # Test 3: Video Seek (HTTP Range Request)
    if mp4_url:
        req_range = urllib.request.Request(mp4_url, headers={"Range": "bytes=100-500"})
        with urllib.request.urlopen(req_range) as r_resp:
            results["3. Seek (Range 206)"] = "PASS" if r_resp.status == 206 and r_resp.headers.get("Content-Range") else f"FAIL ({r_resp.status})"
            print(f"Test 3 - Seek (HTTP Range): Status {r_resp.status}, Range: {r_resp.headers.get('Content-Range')}")
    else:
        results["3. Seek (Range 206)"] = "FAIL"
        
    # Test 4: Upload PDF
    dummy_pdf_bytes = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0>>endobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\ntrailer<</Size 3/Root 1 0 R>>\nstartxref\n99\n%%EOF"
    s4, r4 = upload_multipart(instructor_token, "test_document.pdf", dummy_pdf_bytes, "application/pdf")
    print(f"Test 6 - Upload PDF: Status {s4}, File URL: {r4.get('file_url')}")
    results["6. Upload PDF"] = "PASS" if s4 == 201 and "file_url" in r4 else f"FAIL ({s4})"
    pdf_url = r4.get("file_url")
    
    # Test 7: Open PDF after upload
    if pdf_url:
        req_pdf = urllib.request.Request(pdf_url)
        with urllib.request.urlopen(req_pdf) as p_resp:
            results["7. Open PDF"] = "PASS" if p_resp.status == 200 and p_resp.headers.get("Content-Type") == "application/pdf" else f"FAIL ({p_resp.status})"
            print(f"Test 7 - Open PDF: Status {p_resp.status}, Content-Type {p_resp.headers.get('Content-Type')}")
    else:
        results["7. Open PDF"] = "FAIL"
        
    # Test 8: File type wrong (.exe / .txt)
    s8, r8 = upload_multipart(instructor_token, "bad_script.exe", b"MZ\x90\x00malicious", "application/x-msdownload")
    results["8. Wrong File Type (.exe)"] = "PASS" if s8 == 400 else f"FAIL ({s8})"
    print(f"Test 8 - Wrong File Type: Status {s8}, Msg: {r8.get('message')}")
    
    # Test 9: File size exceeded (> 50 MB)
    large_bytes = b"0" * (51 * 1024 * 1024) # 51 MB
    s9, r9 = upload_multipart(instructor_token, "too_large.mp4", large_bytes, "video/mp4")
    results["9. File Size Exceeded (>50MB)"] = "PASS" if s9 in [400, 413] else f"FAIL ({s9})"
    print(f"Test 9 - File Size Exceeded: Status {s9}, Msg: {r9.get('message')}")
    
    # Test 10: Student has no permission (403)
    s10, r10 = upload_multipart(student_token, "student_try.mp4", dummy_mp4_bytes, "video/mp4")
    results["10. Student Upload Blocked (403)"] = "PASS" if s10 == 403 else f"FAIL ({s10})"
    print(f"Test 10 - Student Upload: Status {s10}, Msg: {r10.get('message')}")
    
    # Test 11: Guest cannot upload (401)
    s11, r11 = upload_multipart(None, "guest_try.mp4", dummy_mp4_bytes, "video/mp4")
    results["11. Guest Upload Blocked (401)"] = "PASS" if s11 == 401 else f"FAIL ({s11})"
    print(f"Test 11 - Guest Upload: Status {s11}")
    
    # Test 12: Unauthorized request rejected (Invalid token)
    s12, r12 = upload_multipart("invalid.token.signature", "tampered.mp4", dummy_mp4_bytes, "video/mp4")
    results["12. Tampered Token Blocked (401)"] = "PASS" if s12 == 401 else f"FAIL ({s12})"
    print(f"Test 12 - Tampered Token: Status {s12}")
    
    print("\n--- Summary of Results ---")
    all_pass = True
    for k, v in results.items():
        print(f"  {k}: {v}")
        if not v.startswith("PASS"):
            all_pass = False
    print("ALL TESTS PASSED:", all_pass)
    return all_pass

if __name__ == "__main__":
    run_tests()
