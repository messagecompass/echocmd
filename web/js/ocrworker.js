import { loadTesseractAsync, urlToDataURL } from './ocr.js';
import * as repos from './repo.js';
import { DataUrl } from './repo.dataurl.js';

export class OcrWorker {
    constructor(workId, url, interval = 20, errorInterval = 200) {
        this.url ="/";
        if (url) this.url = url;
        this.interval = interval;
        this.workId = workId;
        this.errorInterval = errorInterval;
    }

    // Method to get OcrItemId with JSON body
    async getOcrItemId(sourceReferenceId, ocrText, errorMessage = '') {
        try {
            console.log(`getOcrItemId wid: ${this.workId} sid: ${sourceReferenceId}`);
            const url = `${this.url}ocrworker`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    WorkId: this.workId,
                    SourceReferenceId: sourceReferenceId,
                    OcrText: ocrText,
                    ErrorMessage: errorMessage
                })
            });
            const data = await response.text();
            return data;
        } catch (error) {
            console.error('Error fetching OCR Item ID:', error);
        }
    }

    //suport two scenarios: one is image id, another is pdf 
    async ocr(sourceReferenceId) {
        if (!sourceReferenceId) return;

        const cachedId = `${sourceReferenceId}_text`;
        var cachedText = await repos.storageIndexedDB.getItem(cachedId);
        if (cachedText) return cachedText;

        var imageUrl = `${this.url}cache/${sourceReferenceId}`;
        var dataUrl = DataUrl.toObject(await urlToDataURL(imageUrl));
        if (dataUrl.mediaSubtype === 'x-zip-compressed') {
            //id: 692_1 application/x-zip-compressed
            console.log(`not support ocr type id: ${sourceReferenceId} ${dataUrl.mediatype}/${dataUrl.mediaSubtype}`);
            return;
        }

        var tesseract = await loadTesseractAsync(window);
        var ocrResult = await tesseract.recognize(dataUrl.toString());

        var ocrText = ocrResult.data.text;
        await repos.storageIndexedDB.setItem(cachedId, ocrText);

        return ocrText;
    }

    async longPoll(sourceReferenceId) {
        let ocrText, errMessage;
        while (true) {
            try {
                sourceReferenceId = await this.getOcrItemId(sourceReferenceId, ocrText);
                if (!sourceReferenceId) {
                    await this.wait(this.interval);
                    continue;
                }
                if (sourceReferenceId ==='sleep') throw Error('into sleep');
                
                ocrText = await this.ocr(sourceReferenceId);
                console.log('OCR Text:', ocrText);
                var ocred = document.getElementById('ocrText');
                ocred.title = sourceReferenceId;
                ocred.innerHTML = ocrText;
            } catch (error) {
                errMessage = `${sourceReferenceId}: ${error}`;
                console.error('loop error:', errMessage);
                await this.wait(this.errorInterval);
            }
        }
    }
    async wait(seconds) {
        await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }
}
