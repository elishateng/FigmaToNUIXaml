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

figma.showUI(__html__);

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

    const componentCode = `<${this.name}
      x:Name="undefined"
      ${atttrbuteCodes.join('\n')}
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

class Layout{

}

class LinearLayout extends Layout {
  linearOrientation:string
  linaerAligment:string  
  cellPadding:number = 0
}

class View extends Component {
  name:String = "View"
  widthSpecification:number
  heightSpecification:number  
  layout:LinearLayout
  childrenNode:SceneNode[] = []

  toXaml(): string {

    let childrenCodeSnippet = ''
    this.childrenNode.forEach((childNode) => {
      const code = generateComponentCode(childNode)
      if (!code) return
      childrenCodeSnippet += code + '\n'
    })

    const componentCode = `<${this.name}
      x:Name="undefined"
      WidthSpecification="${this.widthSpecification}"
      HeightSpecification="${this.heightSpecification}"    
      
      <View.Layout>
        <LinearLayout LinearOrientation="${this.layout.linearOrientation}" LinearAlignment="${this.layout.linaerAligment}" CellPadding="${this.layout.cellPadding},${this.layout.cellPadding}" />
      </View.Layout>

      ${childrenCodeSnippet}
    />`

    return componentCode
  }
}

const NUI_COMPONENTS = {
  'Button': Button,
  'View': View
}

const toHex = ({r,g,b}) => "#" + ((1 << 24) + ((r * 255 | 0) << 16) + ((g * 255 | 0) << 8) + (b * 255 | 0)).toString(16).slice(1)

const generateComponentCode = (layer:SceneNode):string => {

  if (layer.type == "INSTANCE") {
    let instanceNode = (layer as InstanceNode)
    const componentType = instanceNode.mainComponent.name
    
    if (componentType == 'Button') {
      const textLayer:TextNode = (instanceNode.findOne(child => child.type == 'TEXT') as TextNode)
      const backgroundLayer:RectangleNode = (instanceNode.findOne(child => child.type == 'RECTANGLE') as RectangleNode)
  
      const button = new Button()
      button.sizeWidth = instanceNode.width
      button.sizeHeight = instanceNode.height
      button.text = textLayer.characters
      button.pointSize = parseInt(textLayer.fontSize.toString())
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
    const view = new View()
    view.widthSpecification = layer.width
    view.heightSpecification = layer.height
    view.layout = new LinearLayout()
    view.layout.cellPadding = layer.itemSpacing
    view.layout.linaerAligment = 'Center'

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
      xamlCode
    })
  }
};

