// URL endpoint server kamu (sesuaikan jika berbeda)
const ENDPOINT_URL = "http://127.0.0.1:8000/fsock/send_message"; // Ganti jika ini bukan URL tujuannya

// Fungsi bantuan untuk nilai acak
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max, fixed = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(fixed));
const getRandomRelay = () => (Math.random() > 0.5 ? "ON" : "OFF");

// Fungsi untuk mendapatkan tanggal (DDMMYYYY) dan waktu (HHmmss) saat ini
function getCurrentDateTime() {
    const now = new Date();
    const date = String(now.getDate()).padStart(2, '0') +
        String(now.getMonth() + 1).padStart(2, '0') +
        now.getFullYear();
    const time = String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');
    return { date, time };
}

// Fungsi utama untuk mengirim data
async function sendDummyData() {
    const { date, time } = getCurrentDateTime();

    const payload = {
        "station_id": 101,
        "device_id": 10,
        "date": date,
        "time": time,
        "latitude": "-7.037519772812557",
        "longitude": "107.5354654236615",
        "s1": [
            {
                "moisture": getRandomInt(0, 100) // Acak antara 0 - 100
            }
        ],
        "s2": [
            {
                "temperature": getRandomFloat(25, 40), // Acak antara 25.00 - 40.00
                "humidity": getRandomInt(10, 90)       // Acak antara 10 - 90
            }
        ],
        "s3": [
            {
                "voltage": getRandomFloat(11.5, 14.5)  // Acak antara 11.50 - 14.50
            }
        ],
        "s4": [
            {
                "current": getRandomFloat(0.5, 5.0)    // Acak antara 0.50 - 5.00
            }
        ],
        "s5": [
            {
                "mode": "manual" // Dibiarkan tetap statis, atau ganti jika ingin diacak
            }
        ],
        "s6": [
            {
                "relay1": getRandomRelay(), // Acak ON/OFF
                "relay2": getRandomRelay()  // Acak ON/OFF
            }
        ],
        "address": "http://100.80.0.20:8100/api/v1/manual/relay",
        "key": "api_riankurniawan_cloud"
    };

    try {
        console.log(`[${time}] Mengirim data ke ${ENDPOINT_URL}...`);

        // Menggunakan fetch bawaan Node.js (pastikan menggunakan Node v18 ke atas)
        const response = await fetch(ENDPOINT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log(`✅ Berhasil! Status: ${response.status}`);
        } else {
            console.error(`❌ Gagal! Status: ${response.status} - ${response.statusText}`);
        }
    } catch (error) {
        console.error(`⚠️ Error koneksi: ${error.message}`);
    }
}

// Jalankan pertama kali secara langsung
sendDummyData();

// Set interval setiap 10 detik (10.000 milidetik)
setInterval(sendDummyData, 10000);