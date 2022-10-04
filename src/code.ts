import {
  exportTheme
} from './code/exporter';
import {
  v1 as uuid
} from 'uuid';
import {
  ExportableBytes
} from "./interfaces";
import {
  CODE_KEYWORD,
  XAML_TMPL
} from './code/template'
import {
  ScriptHTMLAttributes
} from 'react';
import {
  XAML_CS_TMPL,
  XAML_CS_CODE
} from './code/code_template';

import  * as PluginConstant  from './constants';

// This shows the HTML page in "ui.html".
//figma.showUI(__html__, { visible: true, width: 240, height: 160 });
figma.showUI(__html__, {
  width: 300,
  height: 450,
  title: "FigmaToNUIXamlPlugin"
});

//Global variables for Xaml Converting
let mydata: number = 0;
let globalInt: number[] = [];
let XamlExportables: ExportableBytes[] = [];
let xamlCode: string = '';
let imageNumber = 1;
let xamlCodes: string[] = [];

figma.showUI(__html__, {
  width: 300,
  height: 450,
  title: "FigmaToNUIXamlPlugin"
});

class Spec {
  toXAML: Function
}

class Position implements Spec {
  x: number
  y: number
  toXAML = () => `${this.x},${this.y}`
}

class BorderRadius implements Spec {
  leftTop: number
  rightTop: number
  leftBottom: number
  rightBottom: number
  toXAML = () => `${this.leftTop},${this.rightTop},${this.leftBottom},${this.rightBottom}`
}

class ResourceUrl implements Spec {
  path: string
  toXAML = () => `${this.path}`
}

class Component {
  name: String
  toXaml() {
    const _this = this
    const atttrbuteCodes = Object.keys(this).map((name) => {
      const attrName = name.charAt(0).toUpperCase() + name.slice(1)
      const property: any = _this[name]
      const value = (property.toXAML) ? property.toXAML() : property
      const code = `${attrName}="${value}"`
      return code
    })

    let id = uuid();
    let newId = id.replace(/-/gi, '');
    const componentCode =
      `
      <${this.name}
      x:Name="undefined${newId}"
      ${atttrbuteCodes.join('\n      ')}
      />`

    return componentCode
  }
}

class TextField extends Component {
  name: String = "TextField"

  sizeWidth: number
  sizeHeight: number
  pointSize: number
  textColor: string
  borderlineWidth: number
  borderlineColor: string
  backgroundColor: string
  cornerRadius: BorderRadius
  horizontalAlignment: string
  verticalAlignment: string
  position2D ? : Position
}

class CheckBox extends Component {
  name: String = "CheckBox"

  sizeWidth: number
  sizeHeight: number

  position2D ? : Position
}

class Switch extends Component {
  name: String = "Switch"

  sizeWidth: number
  sizeHeight: number

  position2D ? : Position
}

class Button extends Component {
  name: String = "Button"

  sizeWidth: number
  sizeHeight: number
  pointSize: number

  text: string
  textColor: string
  backgroundColor: string
  cornerRadius: BorderRadius

  position2D ? : Position
}

class ImageView extends Component {
  name: String = "ImageView"
  sizeWidth: number
  sizeHeight: number
  resourceUrl: ResourceUrl
}

class TextLabel extends Component {
  name: String = "TextLabel"

  sizeWidth: number
  sizeHeight: number
  pointSize: number

  text: string
  textColor: string
  horizontalAlignment: string
  verticalAlignment: string
  multiLine: string

  position2D ? : Position
}

class Layout {
  type: string
  linearOrientation: string
  linaerAligment: string
  cellPadding: number = 0
}

class View extends Component {
  name: String = "View"
  backgroundColor: string
  backgroundImage: string
  position2D ? : Position
  widthSpecification: number
  heightSpecification: number
  layout: Layout
  cornerRadius: BorderRadius
  childrenNode: SceneNode[] = []

  toXaml(parentLayoutType: string = ''): string {

    let id = uuid();
    let newId = id.replace(/-/gi, '');
    let childrenCodeSnippet = ''
    this.childrenNode.forEach((childNode) => {
      const code = generateComponentCode(childNode, parentLayoutType)
      if (!code) return
      childrenCodeSnippet += code + '\n'
    })

    let backgroundCodeSnippet = ''
    backgroundCodeSnippet += this.backgroundImage ? `\n      BackgroundImage="${this.backgroundImage}"` : this.backgroundColor ? `\n      BackgroundColor="${this.backgroundColor}"` : "";

    let layoutCodeSnippet = ''
    layoutCodeSnippet += this.layout.type == 'LINEAR' ? `<LinearLayout LinearOrientation="${this.layout.linearOrientation}" LinearAlignment="${this.layout.linaerAligment}" CellPadding="${this.layout.cellPadding},${this.layout.cellPadding}" />` : `<AbsoluteLayout />`;

    let positionCodeSnippet = ''
    positionCodeSnippet += parentLayoutType == 'ABSOLUTE' ? `\n      Position2D="${this.position2D.toXAML()}"` : ``;

    let cornerRadiusCodeSnippet = ''
    cornerRadiusCodeSnippet += this.cornerRadius ? `\n      CornerRadius="${this.cornerRadius.toXAML()}"` : ``;

    const componentCode =
      `
      <${this.name}
      x:Name="undefined${newId}"
      WidthSpecification="${this.widthSpecification}"
      HeightSpecification="${this.heightSpecification}"${positionCodeSnippet}${backgroundCodeSnippet}${cornerRadiusCodeSnippet}
      >
      
      <View.Layout>
        ${layoutCodeSnippet}
      </View.Layout>

      ${childrenCodeSnippet}
      </View>`

    return componentCode
  }
}

const NUI_COMPONENTS = {
  'Button': Button,
  'View': View,
  'TextLabel': TextLabel,
  'ImageView': ImageView,
}

const toHex = ({
  r,
  g,
  b
}) => "#" + ((1 << 24) + ((r * 255 | 0) << 16) + ((g * 255 | 0) << 8) + (b * 255 | 0)).toString(16).slice(1)

async function exportXaml(node: SceneNode, resName: string) {
  let setting: ExportSettings = {
    format: "PNG",
    suffix: '',
    constraint: {
      type: "SCALE",
      value: 1
    },
    contentsOnly: true
  };

  const bytes = await node.exportAsync(setting);
  XamlExportables.push({
    name: resName,
    setting: setting,
    bytes: bytes,
    blobType: 'image/png',
    extension: '.png'
  });
}

const generateComponentCode = (layer: SceneNode, parentLayoutType: string = ''): string => {

  console.log(layer.type);
  if (layer.type == "INSTANCE") {
    let instanceNode = (layer as InstanceNode)

    console.log(instanceNode);
    const componentType = instanceNode.mainComponent.parent.type == 'COMPONENT_SET' ? instanceNode.mainComponent.parent.name : instanceNode.mainComponent.name;

    if (componentType.search('Card/') == 0) {
      console.log('find card');
      const view = new View()

      view.widthSpecification = layer.width
      view.heightSpecification = layer.height
      view.layout = new Layout()
      view.layout.cellPadding = layer.itemSpacing
      view.layout.linaerAligment = formatAlignment(layer.primaryAxisAlignItems);

      if (layer.topLeftRadius > 0) {
        const radius = new BorderRadius()
        radius.leftTop = layer.topLeftRadius
        radius.leftBottom = layer.bottomLeftRadius
        radius.rightBottom = layer.bottomRightRadius
        radius.rightTop = layer.topRightRadius
        view.cornerRadius = radius
      }

      if (layer.backgrounds[0]) {
        if (layer.backgrounds[0].type == 'SOLID') {
          let viewColor: string = toHex(layer.fills[0].color);
          let opacity: string = (layer.fills[0].opacity * 255 | 0).toString(16);
          if (opacity == '0')
            opacity = '00';

          viewColor = viewColor + opacity;
          view.backgroundColor = viewColor;
        } else if (layer.backgrounds[0].type == 'IMAGE') {
          layer.children.forEach((childNode) => {
            childNode.visible = false;
          })
          imageNumber++;
          view.backgroundImage = "*Resource*/images/image" + imageNumber + ".png";
          exportXaml(layer, 'image' + imageNumber).then(() => {
            console.log('exportXaml : ' + XamlExportables.length);

            layer.children.forEach((childNode) => {
              childNode.visible = true;
            })
          });
        }
      }

      if (parentLayoutType == 'ABSOLUTE') {
        const pos = new Position()
        pos.x = instanceNode.x;
        pos.y = instanceNode.y;
        view.position2D = pos;
      }

      console.log(layer.layoutMode);
      if (layer.layoutMode == 'VERTICAL') {
        view.layout.linearOrientation = 'Vertical'
        view.layout.type = "LINEAR"
      } else if (layer.layoutMode == 'HORIZONTAL') {
        view.layout.linearOrientation = 'Horizontal'
        view.layout.type = "LINEAR"
      } else {
        view.layout.type = "ABSOLUTE"
        //return
      }

      layer.children.forEach((child) => view.childrenNode.push(child))

      const xaml = view.toXaml(parentLayoutType)

      return xaml

    } else if (componentType == 'TextField') {
      const textLayer: TextNode = (instanceNode.findOne(child => child.type == 'TEXT') as TextNode)

      const textField = new TextField()
      textField.sizeWidth = instanceNode.width
      textField.sizeHeight = instanceNode.height
      textField.pointSize = parseInt(textLayer.fontSize.toString()) / 6;
      textField.textColor = toHex(textLayer.fills[0].color)

      if (parentLayoutType == 'ABSOLUTE') {
        const pos = new Position()
        pos.x = instanceNode.x;
        pos.y = instanceNode.y;
        textField.position2D = pos;
      }

      textField.backgroundColor = toHex(instanceNode.fills[0].color)
      textField.borderlineColor = toHex((instanceNode.strokes[0] as SolidPaint).color)
      textField.borderlineWidth = instanceNode.strokeWeight;

      if (instanceNode.topLeftRadius) {
        const radius = new BorderRadius()
        radius.leftTop = instanceNode.topLeftRadius
        radius.leftBottom = instanceNode.bottomLeftRadius
        radius.rightBottom = instanceNode.bottomRightRadius
        radius.rightTop = instanceNode.topRightRadius
        textField.cornerRadius = radius
        textField.horizontalAlignment = formatTextHorizontalAlignment(textLayer.textAlignHorizontal);
        textField.verticalAlignment = formatTextVerticalAlignment(textLayer.textAlignVertical);
      }

      const xaml = textField.toXaml()

      return xaml
    } else if (componentType == 'CheckBox') {
      const checkBox = new CheckBox()
      checkBox.sizeWidth = instanceNode.width;
      checkBox.sizeHeight = instanceNode.height;

      if (parentLayoutType == 'ABSOLUTE') {
        const pos = new Position()
        pos.x = instanceNode.x;
        pos.y = instanceNode.y;
        checkBox.position2D = pos;
      }

      const xaml = checkBox.toXaml();
      return xaml;

    } else if (componentType == 'Switch') {
      const switchComponent = new Switch()
      switchComponent.sizeWidth = instanceNode.width;
      switchComponent.sizeHeight = instanceNode.height;

      if (parentLayoutType == 'ABSOLUTE') {
        const pos = new Position()
        pos.x = instanceNode.x;
        pos.y = instanceNode.y;
        switchComponent.position2D = pos;
      }

      const xaml = switchComponent.toXaml();
      return xaml;

    } else if (componentType == 'ImageView') {
      const imageView = new ImageView();
      imageView.sizeWidth = instanceNode.width;
      imageView.sizeHeight = instanceNode.height;

      imageNumber++;
      const url = new ResourceUrl();
      url.path = "*Resource*/images/image" + imageNumber + ".png";
      imageView.resourceUrl = url;

      exportXaml(instanceNode, 'image' + imageNumber).then(() => {
        console.log('exportXaml : ' + XamlExportables.length);
      }).catch(() => {
        console.log('export failed!')
      });

      const xaml = imageView.toXaml();
      return xaml;
    } else if (componentType == 'TextLabel') {
      const textLayer: TextNode = (instanceNode.findOne(child => child.type == 'TEXT') as TextNode)
      const textLabel = new TextLabel()
      textLabel.sizeWidth = instanceNode.width
      textLabel.sizeHeight = instanceNode.height
      textLabel.pointSize = parseInt(textLayer.fontSize.toString()) / 6;
      textLabel.text = textLayer.characters;
      textLabel.textColor = toHex(textLayer.fills[0].color);
      textLabel.horizontalAlignment = formatTextHorizontalAlignment(textLayer.textAlignHorizontal);
      textLabel.verticalAlignment = formatTextVerticalAlignment(textLayer.textAlignVertical);
      //[ToDo] : singleline and multiline should be considered here
      textLabel.multiLine = "True";

      if (parentLayoutType == 'ABSOLUTE') {
        const pos = new Position()
        pos.x = instanceNode.x;
        pos.y = instanceNode.y;
        textLabel.position2D = pos;
      }

      const xaml = textLabel.toXaml();

      return xaml;
    } else if (componentType == 'Button') {
      console.log(instanceNode)
      const textLayer: TextNode = (instanceNode.findOne(child => child.type == 'TEXT') as TextNode)

      const button = new Button()
      button.sizeWidth = instanceNode.width
      button.sizeHeight = instanceNode.height
      button.text = textLayer.characters
      button.pointSize = parseInt(textLayer.fontSize.toString()) / 6;
      button.textColor = toHex(textLayer.fills[0].color)

      if (parentLayoutType == 'ABSOLUTE') {
        const pos = new Position()
        pos.x = instanceNode.x;
        pos.y = instanceNode.y;
        button.position2D = pos;
      }

      //[WillUse] : button customize function should be implemented later here
      //ex)
      //button.backgroundColor = toHex(instanceNode.fills[0].color)

      if (instanceNode.topLeftRadius) {
        const radius = new BorderRadius()
        radius.leftTop = instanceNode.topLeftRadius
        radius.leftBottom = instanceNode.bottomLeftRadius
        radius.rightBottom = instanceNode.bottomRightRadius
        radius.rightTop = instanceNode.topRightRadius
        button.cornerRadius = radius
      }

      const xaml = button.toXaml()

      return xaml
    }
  } else if (layer.type == 'FRAME') {
    console.log(layer);
    const frameLayer: FrameNode = layer as FrameNode;
    const view = new View()

    view.widthSpecification = layer.width
    view.heightSpecification = layer.height
    view.layout = new Layout()
    view.layout.cellPadding = layer.itemSpacing
    view.layout.linaerAligment = formatAlignment(layer.primaryAxisAlignItems);

    if (layer.topLeftRadius > 0) {
      const radius = new BorderRadius()
      radius.leftTop = layer.topLeftRadius
      radius.leftBottom = layer.bottomLeftRadius
      radius.rightBottom = layer.bottomRightRadius
      radius.rightTop = layer.topRightRadius
      view.cornerRadius = radius
    }

    view.position2D = new Position();
    if (layer.parent.type == 'PAGE') {
      view.position2D.x = 0;
      view.position2D.y = 0;
      parentLayoutType = layer.layoutMode == 'NONE' ? 'ABSOLUTE' : 'LIENAR';
    } else if (layer.parent.type == 'FRAME') {

      parentLayoutType = layer.parent.layoutMode == 'NONE' ? 'ABSOLUTE' : 'LIENAR';
      if (parentLayoutType == 'ABSOLUTE') {
        view.position2D.x = layer.x;
        view.position2D.y = layer.y;
      }
    }

    console.log(layer.layoutMode);
    if (layer.layoutMode == 'VERTICAL') {
      view.layout.linearOrientation = 'Vertical'
      view.layout.type = "LINEAR"
    } else if (layer.layoutMode == 'HORIZONTAL') {
      view.layout.linearOrientation = 'Horizontal'
      view.layout.type = "LINEAR"
    } else {
      view.layout.type = "ABSOLUTE"
      //return
    }

    layer.children.forEach((child) => view.childrenNode.push(child))

    if (layer.backgrounds[0].type == 'SOLID') {
      let viewColor: string = toHex(frameLayer.fills[0].color);
      let opacity: string = (frameLayer.fills[0].opacity * 255 | 0).toString(16);
      viewColor = viewColor + opacity;
      view.backgroundColor = viewColor;
    } else if (layer.backgrounds[0].type == 'IMAGE') {

      let cloneLayer = layer.clone();
      cloneLayer.children.forEach((childNode) => {
        childNode.visible = false;
      })
      imageNumber++;
      view.backgroundImage = "*Resource*/images/image" + imageNumber + ".png";
      exportXaml(cloneLayer, 'image' + imageNumber).then(() => {
        console.log('exportXaml : ' + XamlExportables.length);

        //Remove clone view
        cloneLayer.remove();
      });
    }

    const xaml = view.toXaml(parentLayoutType)

    return xaml
  }
}

const formatAlignment = (format: string): string => {
  switch (format) {
    case "MIN":
      return 'Begin'
    case "CENTER":
      return 'Center'
    case "MAX":
      return 'End'
    default:
      return ''
  }
}

const formatTextVerticalAlignment = (format: string): string => {
  switch (format) {
    case "TOP":
      return 'Top'
    case "CENTER":
      return 'Center'
    case "BOTTOM":
      return 'Bottom'
    default:
      return ''
  }
}

const formatTextHorizontalAlignment = (format: string): string => {
  switch (format) {
    case "LEFT":
      return 'Begin'
    case "CENTER":
      return 'Center'
    case "RIGHT":
      return 'End'
    default:
      return ''
  }
}

//Export Theme as cs file
const generateThemeCode = (): string => {
  let compSetArray: (PageNode | SceneNode)[] = figma.root.findAll((n) => {
    let isComponent = false;
    return (n.type === "COMPONENT" && n.parent.type != "COMPONENT_SET" || n.type === "COMPONENT_SET")
  });

  let themeCSCode: string = '';

  for (let compSet of compSetArray) {
    if (compSet.type === "COMPONENT_SET") {
      if (compSet.name == 'Button') {

        let themeCode: string = '';

        let compDefault: ComponentNode = (compSet.findOne(child => child.name == 'Default') as ComponentNode);
        let compPressed: ComponentNode = (compSet.findOne(child => child.name == 'Pressed') as ComponentNode);
        let compFocused: ComponentNode = (compSet.findOne(child => child.name == 'Focused') as ComponentNode);
        let compSelected: ComponentNode = (compSet.findOne(child => child.name == 'Selected') as ComponentNode);
        let compDisabled: ComponentNode = (compSet.findOne(child => child.name == 'Disabled') as ComponentNode);

        const textDefault: TextNode = compDefault ? (compDefault.findOne(child => child.type == 'TEXT') as TextNode) : null
        const textPressed: TextNode = compPressed ? (compPressed.findOne(child => child.type == 'TEXT') as TextNode) : null
        const textFocused: TextNode = compFocused ? (compFocused.findOne(child => child.type == 'TEXT') as TextNode) : null
        const textSelected: TextNode = compSelected ? (compSelected.findOne(child => child.type == 'TEXT') as TextNode) : null
        const textDisabled: TextNode = compDisabled ? (compDisabled.findOne(child => child.type == 'TEXT') as TextNode) : null

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
        let result = themeCode.replace(/\n(\ |\n)*\n/gi, '\n');
        result = XAML_CS_TMPL.replace('__CODE__', result).replace(/__CLASS__/gi, 'Button');
        themeCSCode += result;
        console.log(result);
      }
    }
  }

  // Message to Plugin UI
  figma.ui.postMessage({
    type: PluginConstant.ConvertedTheme,
    value: '',
    filename: themeCSCode
  });

  return;
}

export function code_ts_function() {
  console.log('my code ts function');
}

// Messages from Plugin UI
figma.ui.onmessage = msg => {
  if (msg.type === PluginConstant.ConvertingXaml) {

    imageNumber = 0;
    xamlCodes = [];

    //For Selected Frame Only
    //const layer: any = (figma.currentPage.selection.length == 1) ? figma.currentPage.selection[0] : null
    figma.currentPage.children.forEach((childNode) => {
      const layer: any = childNode;
      const code = generateComponentCode(layer, 'root')
      xamlCodes.push(XAML_TMPL.replace(CODE_KEYWORD, code));
    })

    // Message to Plugin UI
    figma.ui.postMessage({
      type: PluginConstant.ConvertedXaml,
      value: XamlExportables,
      layout: xamlCodes
    });
  } else if (msg.type == PluginConstant.ExportingXaml) {

    // Message from Plugin UI
    figma.ui.postMessage({
      type: PluginConstant.ExportedXaml,
      value: XamlExportables,
      layout: xamlCodes
    });
  } else if (msg.type == PluginConstant.ConvertingTheme) {
    // [WillUse] : NUI Components Theme Export
    // [WillUse] : genertedThemeCode shoulde be moved later
    //exportTheme();
    const xaml_cs_code = generateThemeCode();
  } else {
    figma.notify('Done!');
  }
};