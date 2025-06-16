// smart-control-client/client.js
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
let activeLanguage = "en";
const SERVER_URL = 'ws://localhost:3000'; // Server URL'niz
const CLIENT_ID = uuidv4(); // Bu client'a özgü benzersiz ID
const CLIENT_METADATA = {
    name: `File Manager App`,
    description: {
        en: 'This application can create, delete, read files.',
        tr: 'Bu uygulama dosya oluşturma, silme, okuma işlemleri yapabilir.'
    },
    capabilities: ["file_create", "file_delete", "file_read", "list_directory"]
};
let docListByLanguage = {
    en: 'file-manager-docs-en.md',
    tr: 'file-manager-docs-tr.md'
}
let messagesByLanguage = {
    'dataContext':{
    en: 'Index content',
    tr: 'Dizin içeriği'
}
}
// Dosya yönetimi için bir çalışma dizini
const WORK_DIR = path.join(__dirname, 'managed_files');
if (!fs.existsSync(WORK_DIR)) {
    fs.mkdirSync(WORK_DIR);
    console.log(`Client: Created managed_files directory: ${WORK_DIR}`);
} else {
    console.log(`Client: Using existing managed_files directory: ${WORK_DIR}`);
}

let ws;
let lastRequesterSmartControlId = null; // Son isteği gönderen SmartControl'ün ID'si

function connectToServer() {
    ws = new WebSocket(SERVER_URL);

    ws.onopen = () => {
        console.log(`Client: Connected to server. Client ID: ${CLIENT_ID}`);
        // Sunucuya kendimizi kaydet
        ws.send(JSON.stringify({
            type: 'REGISTER',
            id: CLIENT_ID,
            metadata: CLIENT_METADATA
        }));
    };

    ws.onmessage = async (message) => {
        let data;
        let rawMessageString;
        try {
            // Gelen mesajı string'e çevir
            // console.log("message",message);
            // console.log("type of",message);
            // let data1 = message.data;
            // console.log("data1",data1);
            // console.log("typeof",data1);


            rawMessageString = message.data;
            // console.log("rawMessageString",rawMessageString);
            // console.log("type of",typeof rawMessageString);

            data = JSON.parse(rawMessageString);
            console.log(`Client: Parsed message from server:`, data);
        } catch (e) {
            console.error(`Client: Failed to parse incoming message as JSON from server: "${rawMessageString}". Error:`, e);
            return; // Geçersiz JSON gelirse işlemi durdur
        }

        // Gelen mesajda requesterSmartControlId varsa kaydet
        if (data.requesterSmartControlId) {
            lastRequesterSmartControlId = data.requesterSmartControlId;
        }

        switch (data.type) {
            case 'PING':
                console.log(`Client: Received PING. Sending PONG.`);
                ws.send(JSON.stringify({ type: 'PONG', id: CLIENT_ID }));
                break;
            case 'REQUEST_DOCUMENTATION':
                try {
                    const docs = fs.readFileSync(path.join(__dirname, 'docs', docListByLanguage[activeLanguage]), 'utf8');
                    ws.send(JSON.stringify({
                        type: 'DOCUMENTATION_RESPONSE',
                        clientId: CLIENT_ID,
                        docs: docs,
                        requesterSmartControlId: lastRequesterSmartControlId
                    }));
                } catch (error) {
                    console.error("Client: Error reading documentation:", error);
                    ws.send(JSON.stringify({
                        type: 'DOCUMENTATION_RESPONSE',
                        clientId: CLIENT_ID,
                        docs: `Dokümantasyon okunamadı: ${error.message}`,
                        error: true,
                        requesterSmartControlId: lastRequesterSmartControlId
                    }));
                }
                break;
            case 'EXECUTE_CODE':
                await executeCode(data.code);
                break;
            case 'REGISTRATION_CONFIRMED':
                console.log(`Client: Server confirmed registration: ${data.message}`);
                break;
            default:
                console.log('Client: Unknown message type from server:', data.type);
        }
    };

    ws.onclose = (event) => {
        console.log(`Client: Disconnected from server. Code: ${event.code}, Reason: ${event.reason}`);
        // Yeniden bağlanmayı dene
        setTimeout(connectToServer, 5000); // 5 saniye sonra tekrar bağlan
    };

    ws.onerror = (error) => {
        console.error('Client: WebSocket Error:', error.message);
    };
}

// Güvenlik Uyarısı: Gelen komutların direkt eval() edilmemesi, güvenli fonksiyonlar üzerinden işlenmesi esastır.
// Bu fonksiyon zaten güvenli bir şekilde komutları işliyor.
async function executeCode(command) {
    let result = { success: false, message: "Bilinmeyen hata." };
    // console.log("command",command," typeof ",typeof command);

    try {
        const parsedCommand = command; // Command zaten server tarafından JSON objesi olarak geliyor


        switch (parsedCommand.action) {
            case 'createFile':
                await createFile(parsedCommand.filename, parsedCommand.content);
                result = { success: true, message: `Dosya '${parsedCommand.filename}' oluşturuldu.` };
                break;
            case 'deleteFile':
                await deleteFile(parsedCommand.filename);
                result = { success: true, message: `Dosya '${parsedCommand.filename}' silindi.` };
                break;
            case 'readFile':
                const content = await readFile(parsedCommand.filename);
                result = { success: true, message: `Dosya '${parsedCommand.filename}' içeriği:`, content: content };
                break;
            // şuan için sadece bu kısım çalışıyor
            case 'listDirectory':
                const files = await listDirectory();
                // console.log("files",files);

                const filesList = files.join('\n'); // dosyaları alt alta sıralar
                // console.log("filesList",filesList);

                result = {
                    success: true,
                    message: `${messagesByLanguage["dataContext"][activeLanguage]}:\n${filesList}`,
                    files: files
                };
                console.log("buraya ulaşamıyor");

                break;
            default:
                result = { success: false, message: `Bilinmeyen komut: ${parsedCommand.action}` };
        }

    } catch (error) {
        console.log("hataya geliyor");

        console.error("Client: Error executing code:", error);
        result = { success: false, message: `Kod yürütülürken hata: ${error.message}` };
    } finally {
        // İşlem sonucunu server'a geri bildir
        console.log("seni seni");
        console.log("result", result);

        ws.send(JSON.stringify({
            type: 'OPERATION_RESULT',
            clientId: CLIENT_ID,
            result: result.success ? 'success' : 'error',
            message: result.message,
            content: result.content,
            files: result.files,
            requesterSmartControlId: lastRequesterSmartControlId // SmartControl'e geri bildirim yapmak için
        }));
    }
}

// Dosya Yönetimi Fonksiyonları
async function createFile(filename, content) {
    const filePath = path.join(WORK_DIR, filename);
    await fs.promises.writeFile(filePath, content, 'utf8');
}

async function deleteFile(filename) {
    const filePath = path.join(WORK_DIR, filename);
    try {
        await fs.promises.unlink(filePath);
    } catch (err) {
        if (err.code === 'ENOENT') {
            throw new Error(`Dosya bulunamadı: ${filename}`);
        }
        throw err; // Diğer hataları tekrar fırlat
    }
}

async function readFile(filename) {
    const filePath = path.join(WORK_DIR, filename);
    try {
        return await fs.promises.readFile(filePath, 'utf8');
    } catch (err) {
        if (err.code === 'ENOENT') {
            throw new Error(`Dosya bulunamadı: ${filename}`);
        }
        throw err;
    }
}

async function listDirectory() {
    return await fs.promises.readdir(WORK_DIR);
}

connectToServer();