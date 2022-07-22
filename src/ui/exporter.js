var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import JSZip from 'jszip';
const toBuffer = (ary) => {
    return ary.buffer.slice(ary.byteOffset, ary.byteLength + ary.byteOffset);
};
export const compressExport = (exportableBytes, filename) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise(res => {
        let zip = new JSZip();
        for (let data of exportableBytes) {
            const { name, setting, bytes, blobType, extension } = data;
            const buffer = toBuffer(bytes);
            let blob = new Blob([buffer], { type: blobType });
            zip.file(`${name}${setting.suffix}${extension}`, blob, { base64: true });
        }
        zip.generateAsync({ type: 'blob' })
            .then((content) => {
            const blobURL = window.URL.createObjectURL(content);
            const link = document.createElement('a');
            link.className = 'button button-primary';
            link.href = blobURL;
            link.download = `${filename}.zip`;
            link.click();
            link.setAttribute('download', `${name}.zip`);
            res();
        });
    });
});
