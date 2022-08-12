import React from 'react';
import ReactDOM from 'react-dom';

import { Select, Button, SectionTitle, TextArea, Input, Text} from 'figma-styled-components';
import { UISelectOption as Option, UIState as State, ExportableBytes} from "./interfaces";
import { CONVENTIONS, ORIGINAL } from './constants';
import { compressExport, toBuffer } from "./ui/exporter";

import JSZip from 'jszip';

import './style.css';

declare function require(path: string): any

class App extends React.Component<{}, State> {
  myExportables:ExportableBytes[];

  constructor(props: {}) {
    super(props);

    this.state = {
      loading: false,
      convention: ORIGINAL,
      xamlCode: 'xaml code will be here',
      fileName: ''
    }

    this.onSelect = this.onSelect.bind(this);
    this.onExport = this.onExport.bind(this);
    this.onExportPng = this.onExportPng.bind(this);
    this.onFileNameChanged = this.onFileNameChanged.bind(this);
    window.addEventListener("message", this.handleMessage.bind(this));
  }

  applyXamlCode = (value : string) => {
    this.setState({xamlCode : value});
  }

  handleMessage(event) {
    const msg = event.data.pluginMessage;
    if (!msg) return;
  
    //[Figma UI : Exports Project]
    if (msg.type === 'exportResults') {

      this.myExportables = msg.value;
      //let myExportables : ExportableBytes[] = msg.value;
      console.log('kth ui exp: ' + this.myExportables.length);
      console.log('kth win message : export results');

      /*
      compressExport(msg.value, msg.filename)
        .then(() => {
          parent.postMessage({ pluginMessage: { type: 'close' } }, '*');
        });
        */

        let generatedCode = `${this.state.xamlCode}`;
        let refinedCode = generatedCode.substring(1);

        let zip = new JSZip();
        zip.file('layout.xaml', refinedCode);
        let imgFolder = zip.folder('images');

        for (let data of this.myExportables) {
          const { name, setting, bytes, blobType, extension } = data;
          const buffer = toBuffer(bytes);

          let blob = new Blob([buffer], { type: blobType })
          imgFolder.file(`${name}${setting.suffix}${extension}`, blob, { base64: true });
        }

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

    if (msg.type === 'xaml-code') {

        //const codeElement = document.getElementById('mytextarea');
        //codeElement.innerText = msg.filename;
        this.myExportables = msg.value;
        console.log('kth ui : ' + this.myExportables.length);

        console.log('kth win mesage : export xaml code');
        this.applyXamlCode(msg.filename);
    }
  }

  onSelect(value: string) {
  }

  onTextChange(value : string) {
      console.log('kth text area is changed!');
  }

  onExport() {
    const pluginMessage = { type: 'to-png' };
    parent.postMessage({ pluginMessage: pluginMessage }, '*');
    //this.setState({ loading: true });
    //const pluginMessage = { type: 'export', value: this.state.convention };
    //parent.postMessage({ pluginMessage: pluginMessage }, '*');
  }

  onExportPng() {
    const pluginMessage = { type: 'to-png' };
    parent.postMessage({ pluginMessage: pluginMessage }, '*');

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

  }

  onToXaml() {
    const pluginMessage = { type: 'to-xaml' };
    parent.postMessage({ pluginMessage: pluginMessage }, '*');
  }

  onFileNameChanged(event : any) {
    //console.log(event.target.value);
    this.setState({fileName : event.target.value});
  }

  render() {
    const defaultOption: Option = { label: ORIGINAL, value: ORIGINAL };
    const options: Option[] = CONVENTIONS.map(conv => {
      return { label: conv, value: conv };
    });

    return (
      <>    
        <div id="loader" hidden={!this.state.loading}>
          <div className="loader"></div>
        </div>

        <div hidden={this.state.loading}>
          <SectionTitle id="title">Result</SectionTitle>
          <TextArea id="xamlCodeArea" value = {this.state.xamlCode} onChange={this.onTextChange}/>
          <Button id="export" fullWidth variant="secondary" onClick={this.onToXaml}>Convert to NUI Xaml</Button>
          <Text id="text"> File Name : </Text>
          <input id="input" onChange={this.onFileNameChanged}/>
          <Button id="export" variant="secondary" fullWidth onClick={this.onExport}>Export as NUI Xaml</Button>
          <Button id="export" variant="secondary" fullWidth onClick={this.onExportPng}>Export as PNG</Button>
        </div>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('plugin'));