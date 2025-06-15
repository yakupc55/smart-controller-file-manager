Dosya Yöneticisi Uygulama Dokümantasyonu

Bu uygulama, aşağıdaki komutları Server üzerinden alıp yürütebilir.

Komutlar:

1. Dosya Oluşturma (createFile)
Belirtilen isimde bir dosya oluşturur ve içine içerik yazar.
Parametreler:
    filename: (string)  Oluşturulacak dosyanın adı.
    content: (string) Dosyaya yazılacak içerik.
Örnek JSON Komutu
json
{
  "action": "createFile",
  "filename": "my_new_file.txt",
  "content": "Bu benim yeni dosyam."
}

2. Dosya Silme (deleteFile)

Belirtilen isimdeki dosyayı siler.
Parametreler:

    filename: (string) Silinecek dosyanın adı.
    Örnek JSON Komutu:

{
  "action": "deleteFile",
  "filename": "old_file.log"
}


3. Dosya Okuma (readFile)

Belirtilen isimdeki dosyanın içeriğini okur ve sunucuya geri gönderir.
Parametreler:

    filename: (string) Okunacak dosyanın adı.
    Örnek JSON Komutu:

{
  "action": "readFile",
  "filename": "important_notes.txt"
}

4. Dizin İçeriğini Listeleme (listDirectory)

Client'ın yönettiği dizindeki tüm dosya ve klasörleri listeler.
Parametreler: (Yok)
Örnek JSON Komutu:

{
  "action": "listDirectory"
}

