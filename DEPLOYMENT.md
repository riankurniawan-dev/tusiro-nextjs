# 🚀 Deployment Guide: Smart Tusiro Apps

Panduan lengkap *step-by-step* untuk backup ke GitHub dan deploy ke server cloud Linux (Ubuntu/Debian) menggunakan **Apache2 + MySQL + PM2**.

---

## Tahap 1: Backup ke GitHub

> Lakukan di komputer lokal Anda (`d:\laragon\www\tusiro`).

### 1.1 Pastikan `.gitignore` Sudah Benar
File `.gitignore` sudah saya siapkan. Pastikan file-file sensitif seperti `.env`, `.env.local`, `venv/`, dan `node_modules/` tidak ikut ter-push.

### 1.2 Inisialisasi Git (Jika Belum)
```bash
cd d:\laragon\www\tusiro
git init
git add .
git commit -m "Initial commit - Smart Tusiro Apps"
```

### 1.3 Buat Repository di GitHub
1. Buka [github.com/new](https://github.com/new)
2. Buat repository baru (misal: `tusiro`)
3. **Jangan centang** "Add README" atau ".gitignore" (sudah ada di lokal)

### 1.4 Push ke GitHub
```bash
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/tusiro.git
git push -u origin main
```

> [!IMPORTANT]
> Ganti `USERNAME_ANDA` dengan username GitHub Anda.

---

## Tahap 2: Persiapan Server Cloud

> Lakukan semua langkah berikut di server cloud via SSH.

### 2.1 Update & Install Dependensi Dasar
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y apache2 mysql-server python3 python3-pip python3-venv git curl
```

### 2.2 Install Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2.3 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

---

## Tahap 3: Konfigurasi MySQL

### 3.1 Amankan MySQL (Opsional tapi Recommended)
```bash
sudo mysql_secure_installation
```

### 3.2 Buat Database & User
```bash
sudo mysql -u root -p
```
```sql
CREATE DATABASE tusiro_db;
CREATE USER 'tusiro_user'@'localhost' IDENTIFIED BY 'GantiDenganPasswordKuat';
GRANT ALL PRIVILEGES ON tusiro_db.* TO 'tusiro_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> [!WARNING]
> Ganti `GantiDenganPasswordKuat` dengan password yang aman.

---

## Tahap 4: Clone & Setup Aplikasi

### 4.1 Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/USERNAME_ANDA/tusiro.git
sudo chown -R $USER:$USER /var/www/tusiro
cd /var/www/tusiro
```

---

### 4.2 Setup Backend (FastAPI + Python)

```bash
cd /var/www/tusiro/backend

# Buat Virtual Environment
python3 -m venv venv
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt
```

**Buat file `.env` untuk Backend:**
```bash
nano .env
```
Isi dengan:
```ini
DB_URL=mysql+pymysql://tusiro_user:GantiDenganPasswordKuat@localhost:3306/tusiro_db
```

**Test Backend dulu (pastikan jalan):**
```bash
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000
```
> Jika muncul `Application startup complete`, berarti backend sukses. Tekan `Ctrl+C` untuk stop.

**Jalankan Backend via PM2:**
```bash
cd /var/www/tusiro/backend
pm2 start "/var/www/tusiro/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000" --name tusiro-backend
```

---

### 4.3 Setup Frontend (Next.js)

```bash
cd /var/www/tusiro

# Buat file .env.local
nano .env.local
```
Isi dengan (ganti dengan domain/IP server Anda):
```ini
NEXT_PUBLIC_API_URL=http://domain-atau-ip-anda.com
NEXT_PUBLIC_WS_URL=ws://domain-atau-ip-anda.com/ws
```

**Install, Build & Jalankan Frontend:**
```bash
npm install
npm run build
pm2 start "npm run start -- -p 3000" --name tusiro-frontend --cwd /var/www/tusiro
```

---

### 4.4 Simpan PM2 agar Auto-Start saat Server Reboot
```bash
pm2 save
pm2 startup
```
> Ikuti perintah yang diberikan oleh `pm2 startup` (biasanya harus dijalankan ulang dengan `sudo`).

---

## Tahap 5: Konfigurasi Apache2 (Reverse Proxy)

Apache akan menjadi *reverse proxy* yang meneruskan traffic dari port 80 ke:
- **Port 8000** → Backend FastAPI (untuk semua request `/api/*` dan `/ws`)
- **Port 3000** → Frontend Next.js (untuk sisanya)

### 5.1 Aktifkan Modul Apache
```bash
sudo a2enmod proxy proxy_http proxy_wstunnel headers rewrite
```

### 5.2 Buat Konfigurasi Virtual Host
```bash
sudo nano /etc/apache2/sites-available/tusiro.conf
```
Isi dengan:
```apache
<VirtualHost *:80>
    ServerName domain-atau-ip-anda.com

    # --- Backend API (FastAPI) ---
    ProxyPass /api http://127.0.0.1:8000/api
    ProxyPassReverse /api http://127.0.0.1:8000/api

    # --- WebSocket untuk Backend ---
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteCond %{REQUEST_URI} ^/ws [NC]
    RewriteRule ^/ws(.*) "ws://127.0.0.1:8000/ws$1" [P,L]

    # --- Frontend Next.js ---
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    # --- Logs ---
    ErrorLog ${APACHE_LOG_DIR}/tusiro-error.log
    CustomLog ${APACHE_LOG_DIR}/tusiro-access.log combined
</VirtualHost>
```

> [!IMPORTANT]
> Ganti `domain-atau-ip-anda.com` dengan domain atau IP publik server Anda.

### 5.3 Aktifkan Site & Restart Apache
```bash
sudo a2ensite tusiro.conf
sudo a2dissite 000-default.conf
sudo systemctl restart apache2
```

---

## Tahap 6: Firewall (Jika Aktif)

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

---

## Tahap 7: SSL/HTTPS dengan Let's Encrypt (Opsional tapi Recommended)

Jika Anda sudah punya domain yang mengarah ke IP server:

```bash
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d domain-anda.com
```

Setelah berhasil, update file `.env.local` frontend:
```ini
NEXT_PUBLIC_API_URL=https://domain-anda.com
NEXT_PUBLIC_WS_URL=wss://domain-anda.com/ws
```

Lalu rebuild frontend:
```bash
cd /var/www/tusiro
npm run build
pm2 restart tusiro-frontend
```

---

## Perintah PM2 yang Berguna

| Perintah | Fungsi |
|---|---|
| `pm2 list` | Lihat semua proses yang berjalan |
| `pm2 logs` | Lihat log real-time |
| `pm2 logs tusiro-backend` | Lihat log backend saja |
| `pm2 restart tusiro-backend` | Restart backend |
| `pm2 restart tusiro-frontend` | Restart frontend |
| `pm2 restart all` | Restart semua |
| `pm2 stop all` | Stop semua |

---

## Cara Update Aplikasi (Setelah Push Perubahan ke GitHub)

```bash
cd /var/www/tusiro
git pull origin main

# Rebuild Frontend
npm install
npm run build
pm2 restart tusiro-frontend

# Restart Backend (jika ada perubahan di backend/)
cd backend
source venv/bin/activate
pip install -r requirements.txt
pm2 restart tusiro-backend
```

---

## Troubleshooting

### Backend tidak bisa konek ke MySQL
- Pastikan service MySQL berjalan: `sudo systemctl status mysql`
- Pastikan password di `.env` sudah benar
- Test koneksi manual: `mysql -u tusiro_user -p tusiro_db`

### Frontend blank / error 502
- Cek apakah frontend jalan: `pm2 list`
- Cek log: `pm2 logs tusiro-frontend`
- Pastikan `npm run build` sukses tanpa error

### Apache error
- Cek config: `sudo apache2ctl configtest`
- Cek log: `sudo tail -f /var/log/apache2/tusiro-error.log`

> [!TIP]
> **Default Login**: Username `admin`, Password `admin`. Segera ganti password setelah deploy!
