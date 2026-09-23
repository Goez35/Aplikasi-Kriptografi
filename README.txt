# Aplikasi Kriptografi

## Fitur
1. Caesar Cipher — klasik
2. Vigenère Cipher — klasik
3. AES-256-GCM — modern
4. RSA-OAEP 2048-bit — modern
5. Super Enkripsi — Caesar → Vigenère → AES → RSA

## Menjalankan
Buka `index.html` dengan browser modern. Untuk fungsi Web Crypto yang lebih stabil, jalankan melalui server lokal (misalnya VS Code Live Server atau XAMPP).

## Catatan Super Enkripsi
RSA tidak digunakan untuk mengenkripsi teks panjang secara langsung. RSA mengenkripsi material kunci AES, sedangkan AES mengenkripsi data. Paket akhir berisi RSA-encrypted AES key dan AES ciphertext. Saat dekripsi, proses dibalik.

## Alur
Enkripsi:
Plaintext → Caesar → Vigenère → AES → RSA (proteksi kunci AES) → Paket Ciphertext

Dekripsi:
Paket Ciphertext → RSA → AES → Vigenère → Caesar → Plaintext
