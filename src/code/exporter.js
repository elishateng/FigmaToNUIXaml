var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { inConvention } from "./convert";
const exportFilename = (convention) => {
    const projectName = figma.root.name;
    return inConvention(convention, projectName);
};
const isValidSelection = (nodes) => {
    return !(!nodes || nodes.length === 0);
};
const formatToBlobType = (format) => {
    switch (format) {
        case "PDF": return 'application/pdf';
        case "SVG": return 'image/svg+xml';
        case "PNG": return 'image/png';
        case "JPG": return 'image/jpeg';
        default: return 'image/png';
    }
};
const formatToExtension = (format) => {
    switch (format) {
        case "PDF": return '.pdf';
        case "SVG": return '.svg';
        case "PNG": return '.png';
        case "JPG": return '.jpg';
        default: return '.png';
    }
};
export function exportAs(convention) {
    return __awaiter(this, void 0, void 0, function* () {
        const nodes = figma.currentPage.selection;
        if (!isValidSelection(nodes)) {
            return new Promise(res => {
                res("Can't export nothing");
                figma.closePlugin();
            });
        }
        let exportableBytes = [];
        for (let node of nodes) {
            let settings;
            const { name, exportSettings } = node;
            if (exportSettings.length === 0) {
                settings = [{ format: "PNG", suffix: '', constraint: { type: "SCALE", value: 1 }, contentsOnly: true }];
            }
            else {
                settings = exportSettings;
            }
            const exportName = inConvention(convention, name);
            console.log(`Exporting "${name}" as "${exportName}"`);
            for (let setting of settings) {
                const bytes = yield node.exportAsync(setting);
                exportableBytes.push({
                    name: exportName,
                    setting: setting,
                    bytes: bytes,
                    blobType: formatToBlobType(setting.format),
                    extension: formatToExtension(setting.format)
                });
            }
            ;
        }
        ;
        figma.showUI(__html__, { visible: false });
        figma.ui.postMessage({
            type: 'exportResults',
            value: exportableBytes,
            filename: exportFilename(convention)
        });
        return new Promise(res => res('Complete export.'));
    });
}
