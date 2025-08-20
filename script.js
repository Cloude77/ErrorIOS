const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const video = document.getElementById('video');
const logsContainer = document.getElementById('logs');

let mediaRecorder;
let recordedChunks = [];

function log(message) {
    const p = document.createElement('p');
    p.textContent = message;
    logsContainer.appendChild(p);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

startButton.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        video.srcObject = stream;

        const mimeTypes = [
            'video/mp4',
            'video/webm',
            'video/mp4;codecs=avc1',
            'video/mp4;codecs=avc1.42E01E,mp4a.40.2'
        ];

        for (let mt of mimeTypes) {
            try {
                mediaRecorder = new MediaRecorder(stream, { mimeType: mt });
                log(`Используется MIME-тип: ${mt}`);
                break;
            } catch (e) {
                log(`MIME-тип ${mt} не поддерживается: ${e.message}`);
            }
        }

        if (!mediaRecorder) {
            log('Ни один из MIME-типов не поддерживается');
            return;
        }

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onerror = event => {
            log(`Ошибка записи: ${event.error}`);
        };

        mediaRecorder.onstart = () => {
            log('Запись начата');
            startButton.disabled = true;
            stopButton.disabled = false;
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
            video.src = URL.createObjectURL(blob);
            log('Запись остановлена');
            startButton.disabled = false;
            stopButton.disabled = true;
            recordedChunks = [];
        };

        mediaRecorder.start();
        log('RecorderState: ' + mediaRecorder.state);
    } catch (e) {
        log(`Ошибка доступа к камере/микрофону: ${e.message}`);
    }
});

stopButton.addEventListener('click', () => {
    mediaRecorder.stop();
});