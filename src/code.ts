import { exportAs, exportPNG, exportTheme } from './code/exporter';
import { v1 as uuid } from 'uuid';
import { ExportableBytes } from "./interfaces";
import {CODE_KEYWORD, XAML_TMPL} from './code/template'
import { ScriptHTMLAttributes } from 'react';
import { XAML_CS_TMPL, XAML_CS_CODE } from './code/code_template';


// This shows the HTML page in "ui.html".
//figma.showUI(__html__, { visible: true, width: 240, height: 160 });
figma.showUI(__html__, {width: 300, height: 450, title: "FigmaToNUIXamlPlugin"}
);

/*
// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the posted message.
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
  case 'export':
    figma.notify('Exporting files...');
    const convention: string = msg.value;

    // Resume after 1 second to allow UI to re-render.
    setTimeout(() => {
      exportAs(convention)
      .then(res => console.log(res));
    }, 1);
    break;

  default:
    console.log('Closing Plugin!');
    figma.notify('Done!');
    figma.closePlugin();
  }
};
*/

let mydata : number = 0;
let globalInt:number[] = [];
let XamlExportables : ExportableBytes[] = [];
let xamlCode:string = '';
let imageNumber = 1;

/*
const CODE_KEYWORD = '__CODE__'

const XAML_TMPL = 
`
<?xml version="1.0" encoding="UTF-8" ?>
<ContentPage x:Class="NUITizenGallery.HelloWorldPage"
  xmlns="http://tizen.org/Tizen.NUI/2018/XAML"
  xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
  WidthSpecification="{Static LayoutParamPolicies.MatchParent}"
  HeightSpecification="{Static LayoutParamPolicies.MatchParent}">

    <!-- AppBar is top-side bar with navigation content, title, and action. If you not set any contents, back button is automatically added. -->
    <ContentPage.AppBar>
        <AppBar x:Name="appBar" Title="HelloWorldPage"/>
    </ContentPage.AppBar>

    <!-- Content is main placeholder of ContentPage. Add your content into this view. -->
    <ContentPage.Content>
        __CODE__
    </ContentPage.Content>
</ContentPage>
`
*/

figma.showUI(__html__, {width: 300, height: 450, title: "FigmaToNUIXamlPlugin"}
);

class Spec {
  toXAML:Function  
}

class Position implements Spec{
  x:number
  y:number
  toXAML = () => `${this.x},${this.y}`
}

class BorderRadius implements Spec{
  leftTop:number
  rightTop:number
  leftBottom:number
  rightBottom:number
  toXAML = () => `${this.leftTop},${this.rightTop},${this.leftBottom},${this.rightBottom}`
}

class ResourceUrl implements Spec {
  path:string
  toXAML = () => `${this.path}`
}

class Component {
  name:String
  toXaml() {
    const _this = this
    const atttrbuteCodes = Object.keys(this).map((name) => {
      const attrName = name.charAt(0).toUpperCase() + name.slice(1)
      const property:any = _this[name]
      const value = (property.toXAML) ? property.toXAML() : property
      const code = `${attrName}="${value}"`
      return code
    })

    let id = uuid();
    let newId = id.replace(/-/gi,'');
    const componentCode = `
    <${this.name}
      x:Name="undefined${newId}"
      ${atttrbuteCodes.join('\n      ')}
    />`

    return componentCode
  }
}

class Button extends Component{
  name:String = "Button"

  sizeWidth:number
  sizeHeight:number
  pointSize:number

  text:string
  textColor:string
  backgroundColor:string
  cornerRadius:BorderRadius

  position2D?:Position
}

class ImageView extends Component {
  name:String = "ImageView"
  sizeWidth:number
  sizeHeight:number
  resourceUrl:ResourceUrl
}

class TextLabel extends Component {
  name:String = "TextLabel"

  sizeWidth:number
  sizeHeight:number
  pointSize:number

  text:string
  textColor:string

  position2D?:Position
}

class Layout{

}

class LinearLayout extends Layout {
  linearOrientation:string
  linaerAligment:string  
  cellPadding:number = 0
}

class View extends Component {
  name:String = "View"
  backgroundColor:string
  backgroundImage: string
  widthSpecification:number
  heightSpecification:number
  layout:LinearLayout
  childrenNode:SceneNode[] = []

  toXaml(): string {

    let id = uuid();
    let newId = id.replace(/-/gi,'');
    let childrenCodeSnippet = ''
    this.childrenNode.forEach((childNode) => {
      const code = generateComponentCode(childNode)
      if (!code) return
      childrenCodeSnippet += code + '\n'
    })

    let backgroundCodeSnippet = ''
    backgroundCodeSnippet += this.backgroundImage ? `BackgroundImage="${this.backgroundImage}"` : this.backgroundColor ? `BackgroundColor="${this.backgroundColor}"` : "";

    const componentCode = `<${this.name}
      x:Name="undefined${newId}"
      WidthSpecification="${this.widthSpecification}"
      HeightSpecification="${this.heightSpecification}"
      ${backgroundCodeSnippet}
      >
      
      <View.Layout>
        <LinearLayout LinearOrientation="${this.layout.linearOrientation}" LinearAlignment="${this.layout.linaerAligment}" CellPadding="${this.layout.cellPadding},${this.layout.cellPadding}" />
      </View.Layout>

      ${childrenCodeSnippet}
    </View>`

    return componentCode
  }
}

const NUI_COMPONENTS = {
  'Button': Button,
  'View': View,
  'TextLabel' : TextLabel,
  'ImageView' : ImageView,
}

const toHex = ({r,g,b}) => "#" + ((1 << 24) + ((r * 255 | 0) << 16) + ((g * 255 | 0) << 8) + (b * 255 | 0)).toString(16).slice(1)

async function exportXaml(node : SceneNode, resName: string) {
  let setting : ExportSettings = { format: "PNG", suffix: '', constraint: { type: "SCALE", value: 1 }, contentsOnly: true };

  const bytes = await node.exportAsync(setting);
  XamlExportables.push({
    name: resName,
    setting: setting,
    bytes: bytes,
    blobType: 'image/png',
    extension: '.png'
  });
}

const generateComponentCode = (layer:SceneNode):string => {

  if (layer.type == "INSTANCE") {
    let instanceNode = (layer as InstanceNode)
    const componentType = instanceNode.mainComponent.name

    if (componentType == 'ImageView') {
      const imageView = new ImageView();
      imageView.sizeWidth = instanceNode.width;
      imageView.sizeHeight = instanceNode.height;

      imageNumber++;
      const url = new ResourceUrl();
      url.path = "*Resource*/images/image" + imageNumber + ".png";
      imageView.resourceUrl = url;

      exportXaml(instanceNode, 'image'+imageNumber).then(()=>{
        console.log('exportXaml : ' + XamlExportables.length);
      });

      const xaml = imageView.toXaml();
      return xaml;
    }
    else if (componentType == 'TextLabel') {
      console.log('TextLabel!!!');
      const textLayer:TextNode = (instanceNode.findOne(child => child.type == 'TEXT') as TextNode)
      const textLabel = new TextLabel()
      textLabel.pointSize = parseInt(textLayer.fontSize.toString()) / 6;
      textLabel.text = textLayer.characters;

      const xaml = textLabel.toXaml();
      return xaml;
    }
    else if (componentType == 'Button') {
      const textLayer:TextNode = (instanceNode.findOne(child => child.type == 'TEXT') as TextNode)
      const backgroundLayer:RectangleNode = (instanceNode.findOne(child => child.type == 'RECTANGLE') as RectangleNode)
  
      const button = new Button()
      button.sizeWidth = instanceNode.width
      button.sizeHeight = instanceNode.height
      button.text = textLayer.characters
      button.pointSize = parseInt(textLayer.fontSize.toString()) / 6;
      button.textColor = toHex(textLayer.fills[0].color)
      
      button.backgroundColor = toHex(backgroundLayer.fills[0].color)
      const radius = new BorderRadius()
      radius.leftTop = backgroundLayer.topLeftRadius
      radius.leftBottom = backgroundLayer.bottomLeftRadius
      radius.rightBottom = backgroundLayer.bottomRightRadius
      radius.rightTop = backgroundLayer.topRightRadius
      button.cornerRadius = radius
      const xaml = button.toXaml()

      return xaml
    }
  } else if (layer.type == 'FRAME') {

    console.log(layer);
    const frameLayer:FrameNode = layer as FrameNode;
    const view = new View()
    view.widthSpecification = layer.width
    view.heightSpecification = layer.height
    view.layout = new LinearLayout()
    view.layout.cellPadding = layer.itemSpacing
    view.layout.linaerAligment = 'Center'

    if (layer.backgrounds[0].type == 'SOLID')
      view.backgroundColor = toHex(frameLayer.fills[0].color);
    else if(layer.backgrounds[0].type == 'IMAGE')
    {
      layer.children.forEach((childNode) => {
        childNode.visible = false;
      })
      imageNumber++;
      view.backgroundImage = "*Resource*/images/image" + imageNumber + ".png";
      exportXaml(layer, 'image' + imageNumber).then(()=>{
        console.log('exportXaml : ' + XamlExportables.length);

        layer.children.forEach((childNode) => {
          childNode.visible = true;
        })
      });
    }

    if (layer.layoutMode == 'VERTICAL') {
      view.layout.linearOrientation = 'Vertical'
    } else if (layer.layoutMode == 'HORIZONTAL') {
      view.layout.linearOrientation = 'Horizontal'
    } else {
      //return
    }

    layer.children.forEach((child) => view.childrenNode.push(child))

    const xaml = view.toXaml()

    return xaml
  }
}

const formatAlignment = (format: string): string => {
  switch(format) {
    case "MIN": return 'Begin'
    case "CENTER": return 'Center'
    case "MAX": return 'End'
    default: return ''
  }
}

//Export Theme as cs file
const generateThemeCode = ():string => {
  let compSetArray:(PageNode | SceneNode)[] = figma.root.findAll((n) => {
  let isComponent = false;
    return (n.type === "COMPONENT" && n.parent.type != "COMPONENT_SET" || n.type === "COMPONENT_SET")}
  );

  let themeCSCode:string = '';

  for (let compSet of compSetArray)
  {
    if (compSet.type === "COMPONENT_SET") {
        if (compSet.name == 'MyButton') {

          let themeCode:string = '';

          let compDefault:ComponentNode = (compSet.findOne(child => child.name == 'Default') as ComponentNode);
          let compPressed:ComponentNode = (compSet.findOne(child => child.name == 'Pressed') as ComponentNode);
          let compFocused:ComponentNode = (compSet.findOne(child => child.name == 'Focused') as ComponentNode);
          let compSelected:ComponentNode = (compSet.findOne(child => child.name == 'Selected') as ComponentNode);
          let compDisabled:ComponentNode = (compSet.findOne(child => child.name == 'Disabled') as ComponentNode);

          const textDefault:TextNode = compDefault? (compDefault.findOne(child => child.type == 'TEXT') as TextNode) : null
          const textPressed:TextNode = compPressed? (compPressed.findOne(child => child.type == 'TEXT') as TextNode) : null
          const textFocused:TextNode = compFocused? (compFocused.findOne(child => child.type == 'TEXT') as TextNode) : null
          const textSelected:TextNode = compSelected? (compSelected.findOne(child => child.type == 'TEXT') as TextNode) : null
          const textDisabled:TextNode = compDisabled? (compDisabled.findOne(child => child.type == 'TEXT') as TextNode) : null

          themeCode =
          `
          Size = new Size(${compDefault.width}, ${compDefault.height}),
          CornerRadius = ${compDefault.cornerRadius as number},
          ItemHorizontalAlignment = HorizontalAlignment.${formatAlignment(compDefault.primaryAxisAlignItems)},
          ItemVerticalAlignment = VerticalAlignment.${formatAlignment(compDefault.counterAxisAlignItems)},

          BackgroundColor = new Selector<Color>()
          {
            ${compDefault? `Normal = new Color("${toHex(compDefault.fills[0].color)}"),` : ``}
            ${compPressed? `Pressed = new Color("${toHex(compPressed.fills[0].color)}"),` : ``}
            ${compFocused? `Focused = new Color("${toHex(compFocused.fills[0].color)}"),` : ``}
            ${compSelected? `Selected = new Color("${toHex(compSelected.fills[0].color)}"),` : ``}
            ${compDisabled? `Disabled = new Color("${toHex(compDisabled.fills[0].color)}"),` : ``}
          },

          Text = new TextLabelStyle()
          {
            TextColor = new Selector<Color>
            {
              ${textDefault? `Normal = new Color("${toHex(textDefault.fills[0].color)}"),` : ``}
              ${textPressed? `Pressed = new Color("${toHex(textPressed.fills[0].color)}"),` : ``}
              ${textFocused? `Focused = new Color("${toHex(textFocused.fills[0].color)}"),` : ``}
              ${textSelected? `Selected = new Color("${toHex(textSelected.fills[0].color)}"),` : ``}
              ${textDisabled? `Disabled = new Color("${toHex(textDisabled.fills[0].color)}"),` : ``}
            },

            PixelSize = ${parseInt(textDefault.fontSize.toString()) / 6}
          }
          `;

          //Remove New Lines
          let result = themeCode.replace(/\n(\ |\n)*\n/gi,'\n');
          result = XAML_CS_TMPL.replace('__CODE__', result).replace(/__CLASS__/gi, 'Button');
          themeCSCode += result;
          console.log(result);
        }
    }
  }

  figma.ui.postMessage({
    type: 'theme-code',
    value: '',
    filename: themeCSCode
  });

  return;
}

export function code_ts_function(){
  console.log('my code ts function');
}

figma.ui.onmessage = msg => {
  if (msg.type === 'to-xaml') {

    imageNumber = 0;
    const layer:any = (figma.currentPage.selection.length == 1) ? figma.currentPage.selection[0] : null
    const code = generateComponentCode(layer)
    xamlCode = XAML_TMPL.replace(CODE_KEYWORD, code)

    //const resource = generatedResource
    //const csCode = generatedCSharpCode

    figma.ui.postMessage({
      type: 'xaml-code',
      value: XamlExportables,
      filename: xamlCode
    });
  }
  else if (msg.type == 'exportCode') {
    console.log('kth exportCode');

//    console.log('global data ' + globalInt);
    //export parent and child components as png file
    /*
    const nodes = figma.currentPage.selection;

    for (const node of nodes) {
      console.log('kth node type : ' + node.type);
      if (node.type === "COMPONENT_SET") {
        const children = node.children;

        for(const child of children) {
          console.log('kth component set child name : ' + child.name);

        }
      }
      else if(node.type === "FRAME") {
        const children = node.children;
        for(const child of children) {
          console.log('kth frame child name : ' + child.name);
        }

      }
    }
    */

    //exportPNG(globalInt);

    figma.ui.postMessage({
      type: 'exportResults',
      value: XamlExportables,
      filename: xamlCode
    });

    console.log('global data ' + globalInt + ' ' + XamlExportables.length);

    //exportAs('Original')
    //const nodes = figma.currentPage.selection;
  }
  else if (msg.type == 'exportTheme') {
    // [WillUse] : 셀렉션 컴포넌트 이미지 Export
    //exportPNG(globalInt);

    // [WillUse] : 기능후현후 이 함수로 이전 예정
    //exportTheme();

    console.log('kth export theme');

    const xaml_cs_code = generateThemeCode();

  }
  else{
    figma.notify('Done!');
  }
};