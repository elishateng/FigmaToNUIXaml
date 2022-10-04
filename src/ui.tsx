import React from 'react';
import ReactDOM from 'react-dom';
import JSZip from 'jszip';
import './style.css';

import { Select, Button, SectionTitle, TextArea, Input, Text} from 'figma-styled-components';
import { UIState as State, ExportableBytes} from "./interfaces";
import  * as PluginConstant  from './constants';
import { toBuffer } from "./ui/exporter";
import { CODE_VIEW_ID} from './code/template'
import {
  CSHARP_SOLUTION_TMPL,
  CSHARP_MANIFEST_TMPL,
  CSHARP_PROJECT_TMPL,
  CSHAP_MAIN_TMPL,
  CSHARP_MAIN_VIEW_VARIABLES,
  CSHARP_MAIN_PAGE_SET_CODE,
  CSHARP_XAML_VIEW_ID,
  CSHARP_XAML_CS_TMPL
} from './code/app_template';

declare function require(path: string): any

class App extends React.Component<{}, State> {
  myExportables:ExportableBytes[];
  myLayouts:string[];

  constructor(props: {}) {
    super(props);

    this.state = {
      loading: false,
      xamlCode: PluginConstant.PluginUI_InputField_Content,
      fileName: ''
    }

    this.onToXaml = this.onToXaml.bind(this);
    this.onExportApplication = this.onExportApplication.bind(this);
    this.onExportTheme = this.onExportTheme.bind(this);
    this.onFileNameChanged = this.onFileNameChanged.bind(this);
    window.addEventListener("message", this.handleMessage.bind(this));
  }

  applyXamlCode = (value : string) => {
    this.setState({xamlCode : value});
  }

  // Messages from Figma Sandbox
  handleMessage(event) {
    const msg = event.data.pluginMessage;
    if (!msg) return;
  
    //[Figma UI : Exports Project]
    if (msg.type === PluginConstant.ExportedXaml) {

      this.myExportables = msg.value;
      this.myLayouts = msg.layout;

      // console.log('length : ' + this.myExportables.length);
      // console.log('win message : export results');

      let zip = new JSZip();
      zip.file('NUIAppSample.sln', CSHARP_SOLUTION_TMPL);
      let nuiAppSample = zip.folder('NUIAppSample');

      nuiAppSample.file('tizen-manifest.xml', CSHARP_MANIFEST_TMPL.slice(1));
      nuiAppSample.file('NUIAppSample.csproj', CSHARP_PROJECT_TMPL);

      let xamls = nuiAppSample.folder('xamls');
      let layoutIndex = 0;
      let csharp_main_view_variables : string[] = [];
      let csharp_main_page_set_code : string[] = [];

      for (let data of this.myLayouts) {
        layoutIndex++;
        let generatedCode = data;
        let refinedCode = generatedCode.substring(1);
        refinedCode = refinedCode.replace(CODE_VIEW_ID, 'ExportedView' + layoutIndex);
        xamls.file('ExportedView'+layoutIndex+'.xaml', refinedCode);

        let view_id = '/' + CSHARP_XAML_VIEW_ID + '/gi';
        console.log(view_id);
        let xaml_cs = CSHARP_XAML_CS_TMPL.replace(/__CSHARP_XAML_VIEW_ID__/gi, 'ExportedView'+layoutIndex);
        xamls.file('ExportedView'+layoutIndex+'.xaml.cs', xaml_cs);

        csharp_main_view_variables.push('private Page ' + 'exportedView' + layoutIndex + ' = null;');
        csharp_main_page_set_code.push(
          `
          ${'exportedView' + layoutIndex} = new ${'ExportedView' + layoutIndex}();
          currentExample = ${'exportedView' + layoutIndex};
          navigator.Push(${'exportedView' + layoutIndex});
          `
        );
      }

      let nuiAppSampleMain = CSHAP_MAIN_TMPL;
      nuiAppSampleMain = nuiAppSampleMain.replace(CSHARP_MAIN_VIEW_VARIABLES, csharp_main_view_variables.join('\n      '));
      nuiAppSampleMain = nuiAppSampleMain.replace(CSHARP_MAIN_PAGE_SET_CODE, csharp_main_page_set_code.join('\n       '));
      nuiAppSample.file('NUIAppSample.cs', nuiAppSampleMain);

      let res = nuiAppSample.folder('res');
      let imgFolder = res.folder('images');

      for (let data of this.myExportables) {
        const { name, setting, bytes, blobType, extension } = data;
        const buffer = toBuffer(bytes);

        let blob = new Blob([buffer], { type: blobType })
        imgFolder.file(`${name}${setting.suffix}${extension}`, blob, { base64: true });
      }

      let shared = nuiAppSample.folder('shared');
      let sharedRes = shared.folder('res');

      zip.generateAsync({ type: 'blob' })
      .then((content) => {
        const blobURL = window.URL.createObjectURL(content);
        const link = document.createElement('a');
        link.className = 'button button-primary';
        link.href = blobURL;
        link.download = `${this.state.fileName}.zip`
        link.click()
        link.setAttribute('download', `${this.state.fileName}.zip`);
      })
    }
    else if (msg.type === PluginConstant.ConvertedXaml) {
        this.myExportables = msg.value;
        this.applyXamlCode(msg.layout[0]);
    }

    else if (msg.type === PluginConstant.ConvertedTheme ) {
      console.log('[UI] ' + msg.filename);
      let zip = new JSZip();
      zip.file('DefaultThemeCommon.cs', msg.filename);

      zip.generateAsync({ type: 'blob' })
      .then((content) => {
        const blobURL = window.URL.createObjectURL(content);
        const link = document.createElement('a');
        link.className = 'button button-primary';
        link.href = blobURL;
        link.download = `DefaultThemeCommon.zip`
        link.click()
        link.setAttribute('download', `DefaultThemeCommon.zip`);
      })
    }
  }


  /*
  ├── NUIAppSample
  │   ├── NUIAppSample.cs
  │   ├── NUIAppSample.csproj
  │   ├── res
  │   │   └── images
  │   ├── shared
  │   │   └── res
  │   │       └── NUIAppSample.png
  │   ├── tizen-manifest.xml
  │   └── xamls
  │       ├── View1.xaml
  │       └── View1.xaml.cs
  ├── NUIAppSample.sln
  └── README.md
  */

  onTextChange(value : string) {
    console.log('Text area is changed!');
  }

  onFileNameChanged(event : any) {
    this.setState({fileName : event.target.value});
  }

  // Messages to Figma Sandbox
  onExportApplication() {
    //this.setState({ loading: true });
    const pluginMessage = { type: PluginConstant.ExportingXaml };
    parent.postMessage({ pluginMessage: pluginMessage }, '*');
  }

  onExportTheme() {
    const pluginMessage = { type: PluginConstant.ConvertingTheme };
    parent.postMessage({ pluginMessage: pluginMessage }, '*');

    // [WillUse] : local app server connect test
    /*
    fetch('http://localhost:8080/build', {
      method: 'POST', // or 'PUT'
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({xaml:'<></>'}),
    }).then((res)=>{
      return res.json();
    });
    */
  }

  onToXaml() {
    const pluginMessage = { type: PluginConstant.ConvertingXaml };
    parent.postMessage({ pluginMessage: pluginMessage }, '*');
  }

  render() {
    return (
      <>    
        <div id="loader" hidden={!this.state.loading}>
          <div className="loader"></div>
        </div>

        <div hidden={this.state.loading}>
          <SectionTitle id="title">Result</SectionTitle>
          <TextArea id="xamlCodeArea" value = {this.state.xamlCode} onChange={this.onTextChange}/>
          <Button id="export" fullWidth variant="secondary" onClick={this.onToXaml}>{PluginConstant.PluginUI_Button_ConvertToNUIXaml}</Button>
          <Text id="text"> File Name : </Text>
          <input id="input" onChange={this.onFileNameChanged}/>
          <Button id="export" variant="secondary" fullWidth onClick={this.onExportApplication}>{PluginConstant.PluginUI_Button_ExportNUIApplication}</Button>
          <Button id="export" variant="secondary" fullWidth onClick={this.onExportTheme}>{PluginConstant.PluginUI_Button_ExportComponentTheme}</Button>
        </div>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('plugin'));