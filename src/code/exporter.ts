import { ExportableBytes } from "../interfaces";
import { inConvention } from "./convert";

const exportFilename = (convention: string): string => {
  const projectName = figma.root.name;
  return inConvention(convention, projectName);
}

const isValidSelection = (nodes: Readonly<SceneNode[]>): boolean => {
  return !(!nodes || nodes.length === 0);
}

const formatToBlobType = (format: string): string => {
  switch(format) {
    case "PDF": return 'application/pdf'
    case "SVG": return 'image/svg+xml'
    case "PNG": return 'image/png'
    case "JPG": return 'image/jpeg'
    default: return 'image/png'
  }
}

const formatToExtension = (format: string): string => {
  switch(format) {
    case "PDF": return '.pdf'
    case "SVG": return '.svg'
    case "PNG": return '.png'
    case "JPG": return '.jpg'
    default: return '.png'
  }
}

export async function exportAs(convention: string): Promise<string> {
  const nodes = figma.currentPage.selection;
  if (!isValidSelection(nodes)) {
    return new Promise(res => {
      res("Can't export nothing");
      figma.closePlugin();
    });
  }

  let exportableBytes: ExportableBytes[] = [];
  for (let node of nodes) {
    let settings: readonly ExportSettings[];
    const { name, exportSettings } = node;

    if (exportSettings.length === 0) {
      settings = [{ format: "PNG", suffix: '', constraint: { type: "SCALE", value: 1 }, contentsOnly: true }];
    } else {
      settings = exportSettings;
    }

    const exportName = inConvention(convention, name);

    for (let setting of settings) {
      const bytes = await node.exportAsync(setting);
      exportableBytes.push({
        name: exportName,
        setting: setting,
        bytes: bytes,
        blobType: formatToBlobType(setting.format),
        extension: formatToExtension(setting.format)
      });
    };
  };

  figma.ui.postMessage({
    type: 'exportResults',
    value: exportableBytes,
    filename: exportFilename(convention)
  });

  return new Promise(res => res('Complete export.'));
}

function exportPNGFile(){

}

export async function exportPNG(): Promise<string> {

  const compSet = figma.root.findAll((n) => {
    let isComponent = false;
    return (n.type === "COMPONENT" && n.parent.type != "COMPONENT_SET" || n.type === "COMPONENT_SET")}
    );
  /*
  const compSet = figma.root.findAllWithCriteria({
    types : [ "COMPONENT" as any | "COMPONENT_SET" as any]
  });
  */

  console.log(compSet);

  for (let c of compSet)
  {
    console.log('compSet: ' + c.name);
  }

  const nodes = figma.currentPage.selection;
  if (!isValidSelection(nodes)) {
    return new Promise(res => {
      res("Can't export nothing");
      figma.closePlugin();
    });
  }

  let exportableBytes: ExportableBytes[] = [];
  for (let node of nodes) {
    let settings: readonly ExportSettings[];
    const { name, exportSettings } = node;

    if(node.type ==="FRAME"){
      const children = node.children;
      let i = 0;
      for (const child of children)
      {
        if (child.type ==="INSTANCE") {
          console.log('instance : ' + child.type);
          let comp = child.mainComponent;
          console.log('comp type : ' + comp.type);
        }

        if (exportSettings.length === 0) {
          settings = [{ format: "PNG", suffix: '', constraint: { type: "SCALE", value: 1 }, contentsOnly: true }];
        } else {
          settings = exportSettings;
        }

        for (let setting of settings) {
          const bytes = await child.exportAsync(setting);
          exportableBytes.push({
            name: "temp" + i,
            setting: setting,
            bytes: bytes,
            blobType: formatToBlobType(setting.format),
            extension: formatToExtension(setting.format)
          });
        };

        i++;
      }
    }
  };

  figma.ui.postMessage({
    type: 'exportResults',
    value: exportableBytes,
    filename: exportFilename("temp")
  });

  return new Promise(res => res('Complete exportPNG.'));
}
