import socket
import threading
import subprocess
import re
import sys

# ======================================================
# PostgreSQL Localhost Proxy
# ======================================================
# เชื่อมโยง localhost:5432 บน Windows ไปยัง PostgreSQL
# ที่รันอยู่บน Docker Container / WSL2 โดยอัตโนมัติ

def get_wsl_ip():
    try:
        out = subprocess.check_output(
            'wsl -d docker-desktop -e /bin/sh -c "cat /proc/net/fib_trie | grep -B 1 \'/32 host LOCAL\'"',
            shell=True
        ).decode()
        for match in re.finditer(r'(\d+\.\d+\.\d+\.\d+)', out):
            ip = match.group(1)
            if not ip.startswith('127.') and not ip.startswith('10.'):
                return ip
    except Exception:
        pass
    return "172.25.13.212"

def forward(src, dst):
    try:
        while True:
            data = src.recv(8192)
            if not data:
                break
            dst.sendall(data)
    except Exception:
        pass
    finally:
        try:
            src.close()
        except Exception:
            pass
        try:
            dst.close()
        except Exception:
            pass

def handle_client(client_socket, target_ip, target_port):
    try:
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.connect((target_ip, target_port))
    except Exception:
        client_socket.close()
        return

    t1 = threading.Thread(target=forward, args=(client_socket, server_socket), daemon=True)
    t2 = threading.Thread(target=forward, args=(server_socket, client_socket), daemon=True)
    t1.start()
    t2.start()

def main():
    target_ip = get_wsl_ip()
    target_port = 5432
    listen_ip = "127.0.0.1"
    listen_port = 5432

    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((listen_ip, listen_port))
    server.listen(100)
    print(f"PostgreSQL proxy running on {listen_ip}:{listen_port} -> {target_ip}:{target_port}", flush=True)

    while True:
        client, addr = server.accept()
        threading.Thread(target=handle_client, args=(client, target_ip, target_port), daemon=True).start()

if __name__ == "__main__":
    main()
