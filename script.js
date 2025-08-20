const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const video = document.getElementById('video');
const logsContainer = document.getElementById('logs');

let mediaRecorder;
let recordedChunks = [];

function log(message, isError = false) {
    const p = document.createElement('p');
    p.textContent = message;
    if (isError) {
        p.style.color = 'red';
    }
    logsContainer.appendChild(p);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

startButton.addEventListener('click', async () => {
    try {
        startButton.disabled = true;
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        video.srcObject = stream;
        video.play(); // Включаем видео после начала записи

        const mimeTypes = [
            'video/webm', // Рекомендуется для большей совместимости
            'video/webm;codecs=vp8,opus',
            'video/mp4',
            'video/mp4;codecs=avc1.42E01E,mp4a.40.2'
        ];

        for (let mt of mimeTypes) {
            try {
                mediaRecorder = new MediaRecorder(stream, { mimeType: mt });
                log(`Используется MIME-тип: ${mt}`);
                break;
            } catch (e) {
                log(`MIME-тип ${mt} не поддерживается: ${e.message}`, true);
            }
        }

        if (!mediaRecorder) {
            log('Ошибка: Ни один из MIME-типов не поддерживается.', true);
            return;
        }

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onerror = event => {
            log(`Ошибка записи: ${event.error}`, true);
            stopButton.click(); // Останавливаем запись в случае ошибки
        };

        mediaRecorder.onstart = () => {
            log('Запись начата');
            stopButton.disabled = false;
        };

        mediaRecorder.onstop = () => {
            if (recordedChunks.length === 0) {
                log('Ошибка: Нет данных для сохранения.', true);
                return;
            }

            try {
                const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
                const url = URL.createObjectURL(blob);
                video.src = url;
                log('Запись остановлена');
                // Можно добавить кнопку для скачивания видео
                const downloadButton = document.createElement('a');
                downloadButton.href = url;
                downloadButton.download = 'recorded_video.webm';
                downloadButton.textContent = 'Скачать видео';
                logsContainer.appendChild(downloadButton);
            } catch (e) {
                log(`Ошибка при создании объекта URL: ${e.message}`, true);
            }
            recordedChunks = [];
            startButton.disabled = false;
            stopButton.disabled = true;
        };

        mediaRecorder.start();
        log('RecorderState: ' + mediaRecorder.state);
    } catch (e) {
        log(`Ошибка доступа к камере/микрофону: ${e.message}`, true);
        startButton.disabled = false;
    }
});

stopButton.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
});