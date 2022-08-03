import { exportAs, exportPNG } from './code/exporter';
import { v1 as uuid } from 'uuid';


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

    const componentCode = `<${this.name}
      x:Name="undefined${newId}"
      WidthSpecification="${this.widthSpecification}"
      HeightSpecification="${this.heightSpecification}"
      BackgroundColor="${this.backgroundColor}"
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

const generateComponentCode = (layer:SceneNode):string => {

  console.log('kth generate ' + layer.type);

  if (layer.type == "INSTANCE") {
    let instanceNode = (layer as InstanceNode)
    const componentType = instanceNode.mainComponent.name

    if (componentType == 'ImageView') {

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

    const frameLayer:FrameNode = layer as FrameNode;
    const view = new View()
    view.widthSpecification = layer.width
    view.heightSpecification = layer.height
    view.layout = new LinearLayout()
    view.layout.cellPadding = layer.itemSpacing
    view.layout.linaerAligment = 'Center'
    view.backgroundColor = toHex(frameLayer.fills[0].color);

    if (layer.layoutMode == 'VERTICAL') {
      view.layout.linearOrientation = 'Vertical'
    } else if (layer.layoutMode == 'HORIZONTAL') {
      view.layout.linearOrientation = 'Horizontal'
    } else return

    layer.children.forEach((child) => view.childrenNode.push(child))

    const xaml = view.toXaml()

    return xaml
  }
}

figma.ui.onmessage = msg => {
  if (msg.type === 'to-xaml') {
    const layer:any = (figma.currentPage.selection.length == 1) ? figma.currentPage.selection[0] : null

    const code = generateComponentCode(layer)
    const xamlCode = XAML_TMPL.replace(CODE_KEYWORD, code)

    figma.ui.postMessage({
      type: 'xaml-code',
      value: '',
      filename: xamlCode
    });
  }
  else if(msg.type == 'to-png') {
    console.log('kth to-png');
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

    exportPNG();

    //exportAs('Original')
    //const nodes = figma.currentPage.selection;
  }
  else{
    figma.notify('Done!');
  }
};