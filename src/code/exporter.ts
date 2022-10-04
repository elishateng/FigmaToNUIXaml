import { ExportableBytes } from "../interfaces";
import { code_ts_function } from "../code";


const isValidSelection = (nodes: Readonly<SceneNode[]>): boolean => {
  return !(!nodes || nodes.length === 0);
}

//Export Logic Here
export async function exportTheme(): Promise<string> {
  // const compSet = figma.root.findAll((n) => {
  // let isComponent = false;
  //   return (n.type === "COMPONENT" && n.parent.type != "COMPONENT_SET" || n.type === "COMPONENT_SET")}
  // );

  // for (let c of compSet)
  // {
  //    if (c.type === "COMPONENT_SET") {
  //       console.log('compSet ' + c.name);

  //       //let code:string = ButtonStyle;

  //       if (c.name == 'MyButton') {
  //          let compArray = c.children;
  //          for (let cc of compArray)
  //          {
  //            console.log(cc.name);
  //          }
  //       }
  //    }
  // }

  // code_ts_function();

  // figma.ui.postMessage({
  //   type: 'exportResults',
  //   value: 'here',
  //   filename: 'temp'
  // });

  return new Promise(res => res('Complete exportTheme.'));
}