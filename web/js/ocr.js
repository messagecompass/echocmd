export const loadTesseractAsync = async (window=window, url = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.0/tesseract.min.js') => {
    return new Promise((resolve, reject) => {
        if (typeof window.Tesseract !== 'undefined') {
            resolve(window.Tesseract);
        } else {
            const scriptTag = window.document.createElement('script');
            scriptTag.onload = function () {
                if (window.Tesseract) {
                    resolve(window.Tesseract);
                } else {
                    reject(new Error('Tesseract script loaded, but Tesseract object not found.'));
                }
            };
            scriptTag.onerror = function (error) {
                reject(error);
            };
            scriptTag.src = url;
            window.document.head.appendChild(scriptTag);
        }
    });
}

export const ocrDataUrl = async (imageDataURL,tesseract) => {
    let result = await tesseract.recognize(imageDataURL);
    return filterJsonSpecialChar(result.data.text);
}

export function filterJsonSpecialChar(ocrText) {
    if (ocrText) {
        ocrText = ocrText.replace(/"/g, '');
        ocrText = ocrText.replace(/["\\]/g, '');
    }
    return ocrText;
}

export const isURL = (text)=> {
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
    return urlRegex.test(text);
};

export const toDataUrlString = async (url)=>
{
    if (!isURL(url)) return;
    return await urlToDataURL(url);
}

export const urlToDataURL = async (url) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';
        xhr.onload = function () {
            if (xhr.status === 200) {
                const blob = xhr.response;

                const reader = new FileReader();
                reader.onloadend = function () {
                    const dataURL = reader.result;
                    resolve(dataURL);
                };

                reader.readAsDataURL(blob);
            } else {
                reject(new Error('Failed to download image'));
            }
        };

        xhr.onerror = function () {
            reject(new Error('Failed to download image'));
        };

        xhr.send();
    });
}