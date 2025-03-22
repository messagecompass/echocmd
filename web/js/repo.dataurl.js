export class DataUrl {
    constructor(mediatype, mediaSubtype, encoding, data) {
      this.mediatype = mediatype;
      this.mediaSubtype = mediaSubtype;
      this.encoding = encoding;
      this.data = data;
    }
  
    toString() {
      return `data:${this.mediatype}/${this.mediaSubtype};${this.encoding},${this.data}`;
    }
  
    getFullType(){
        return `${this.mediatype}/${this.mediaSubtype}`;
    }

    static convert2String(obj){
      return `data:${obj.mediatype}/${obj.mediaSubtype};${obj.encoding},${obj.data}`;
    }
    
    static toObject(urlText) {
      if (typeof urlText !=='string') 
        {
           return convertObjectToDataUrl(urlText);     
        }

      const matches = urlText.match(/^data:([^/]+)\/([^;]+);([^,]+),(.+)$/);
      if (matches) {
        return new DataUrl(matches[1], matches[2], matches[3], matches[4]);
      }
      return null;

      function convertObjectToDataUrl(obj) {
        if (obj instanceof DataUrl) {
          return obj;
        }
        const { mediatype, mediaSubtype, encoding, data } = obj;
        if (mediatype && mediaSubtype && encoding && data) {
          return new DataUrl(mediatype, mediaSubtype, encoding, data);
        }
        throw new Error('Invalid object format. Must contain mediatype, mediaSubtype, encoding, and data properties.');
      }
    }
 
    
    getFileExtension() {
      const extensions = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "text/html": "html",
        "application/json": "json",
        "audio/wav": "wav",
        "text/plain": "txt"
      };
      const mediaType = `${this.mediatype}/${this.mediaSubtype}`;
      return extensions[mediaType] || "";
    }
  
    static GetTypeString = (item) => {
        return Object.prototype.toString.call(item).slice(8, -1);         
    }


    static async parseToDataUrl(item) {
      let blob = null;
      let type = this.GetTypeString(item);
      if (type === "Blob" || type === "File") {
        blob = item;
      } else {
        if (item.type === 'text/plain' && item.kind === 'string') {
          return new Promise((resolve, reject) => {
            item.getAsString((text) => {
              const base64String = btoa(text); // Encode the string to base64
              const dataUrl = `data:text/plain;base64,${base64String}`;
              resolve(DataUrl.toObject(dataUrl));
            });
          });
        } else {
          blob = item.getAsFile();
        }
      }
  
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (event) {
          const dataUrl = event.target.result;
          resolve(DataUrl.toObject(dataUrl));
        };
        reader.onerror = (error) => {
          reject(error);
        };
        reader.readAsDataURL(blob);
      });
    }
  
    static createDataByText(text) {
      const base64String = btoa(text); // Encode the string to base64
      const dataUrl = `data:text/plain;base64,${base64String}`;
      return DataUrl.toObject(dataUrl);
    }
  
    getText() {
      if (this.mediatype === "text" && this.mediaSubtype === "plain" && this.encoding === "base64") {
        return atob(this.data);
      }
      return null;
    }
  
    generateUniqueFileName() {
      const hash = this.sha1(this.data);
      const extension = this.getFileExtension();
      return `${this.mediatype}_${hash}.${extension}`;
    }
  
    sha1(data) {
      const rotateLeft = (n, s) => (n << s) | (n >>> (32 - s));
      const toHexStr = (n) => (n >>> 0).toString(16).padStart(8, "0");
  
      const msg = unescape(encodeURIComponent(data));
      const msgLen = msg.length;
      const wordArray = [];
      for (let i = 0; i < msgLen - 3; i += 4) {
        const j =
          (msg.charCodeAt(i) << 24) |
          (msg.charCodeAt(i + 1) << 16) |
          (msg.charCodeAt(i + 2) << 8) |
          msg.charCodeAt(i + 3);
        wordArray.push(j);
      }
  
      let i;
      switch (msgLen % 4) {
        case 0:
          i = 0x080000000;
          break;
        case 1:
          i = (msg.charCodeAt(msgLen - 1) << 24) | 0x0800000;
          break;
        case 2:
          i =
            (msg.charCodeAt(msgLen - 2) << 24) |
            (msg.charCodeAt(msgLen - 1) << 16) |
            0x08000;
          break;
        case 3:
          i =
            (msg.charCodeAt(msgLen - 3) << 24) |
            (msg.charCodeAt(msgLen - 2) << 16) |
            (msg.charCodeAt(msgLen - 1) << 8) |
            0x80;
          break;
      }
  
      wordArray.push(i);
  
      while (wordArray.length % 16 !== 14) wordArray.push(0);
  
      wordArray.push(msgLen >>> 29);
      wordArray.push((msgLen << 3) & 0x0ffffffff);
  
      let H0 = 0x67452301;
      let H1 = 0xefcdab89;
      let H2 = 0x98badcfe;
      let H3 = 0x10325476;
      let H4 = 0xc3d2e1f0;
  
      const W = new Array(80);
      let a, b, c, d, e;
      for (let blockstart = 0; blockstart < wordArray.length; blockstart += 16) {
        for (let i = 0; i < 16; i++) W[i] = wordArray[blockstart + i];
        for (let i = 16; i <= 79; i++)
          W[i] = rotateLeft(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
  
        a = H0;
        b = H1;
        c = H2;
        d = H3;
        e = H4;
  
        for (let i = 0; i <= 19; i++) {
          const temp =
            (rotateLeft(a, 5) + ((b & c) | (~b & d)) + e + W[i] + 0x5a827999) &
            0x0ffffffff;
          e = d;
          d = c;
          c = rotateLeft(b, 30);
          b = a;
          a = temp;
        }
  
        for (let i = 20; i <= 39; i++) {
          const temp =
            (rotateLeft(a, 5) + (b ^ c ^ d) + e + W[i] + 0x6ed9eba1) &
            0x0ffffffff;
          e = d;
          d = c;
          c = rotateLeft(b, 30);
          b = a;
          a = temp;
        }
  
        for (let i = 40; i <= 59; i++) {
          const temp =
            (rotateLeft(a, 5) +
              ((b & c) | (b & d) | (c & d)) +
              e +
              W[i] +
              0x8f1bbcdc) &
            0x0ffffffff;
          e = d;
          d = c;
          c = rotateLeft(b, 30);
          b = a;
          a = temp;
        }
  
        for (let i = 60; i <= 79; i++) {
          const temp =
            (rotateLeft(a, 5) + (b ^ c ^ d) + e + W[i] + 0xca62c1d6) &
            0x0ffffffff;
          e = d;
          d = c;
          c = rotateLeft(b, 30);
          b = a;
          a = temp;
        }
  
        H0 = (H0 + a) & 0x0ffffffff;
        H1 = (H1 + b) & 0x0ffffffff;
        H2 = (H2 + c) & 0x0ffffffff;
        H3 = (H3 + d) & 0x0ffffffff;
        H4 = (H4 + e) & 0x0ffffffff;
      }
  
      return toHexStr(H0) + toHexStr(H1) + toHexStr(H2) + toHexStr(H3) + toHexStr(H4);
    }
  }
 
