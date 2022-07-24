import React from 'react';
import ReactDOM from 'react-dom';

import { Select, Button, SectionTitle, TextArea } from 'figma-styled-components';
import { UISelectOption as Option, UIState as State} from "./interfaces";
import { CONVENTIONS, ORIGINAL } from './constants';
import { compressExport } from "./ui/exporter";

import JSZip from 'jszip';

import './style.css';

declare function require(path: string): any

let xamlCode = "hello";

/*
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;

  if (msg.type === 'exportResults') {
    compressExport(msg.value, msg.filename)
      .then(() => {
        parent.postMessage({ pluginMessage: { type: 'close' } }, '*');
      });
  }

  if (msg.type === 'xaml-code') {
      console.log('ui kth');
      console.log('ui xaml'+ msg.filename);
      xamlCode = 'good';
  }
}
*/

class App extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);

    this.state = {
      loading: false,
      convention: ORIGINAL,
      xamlCode: 'good'
    }

    this.onSelect = this.onSelect.bind(this);
    this.onExport = this.onExport.bind(this);

    window.addEventListener("message", this.handleMessage.bind(this));
  }


  reactfunction (){
    console.log('good 777');
  }

  applyXamlCode = (value : string) => {
    this.setState({xamlCode : value});
  }

  handleMessage(event) {
    console.log('good!!!!!!!!!!');
    const msg = event.data.pluginMessage;
    if (!msg) return;
  
    if (msg.type === 'exportResults') {
      console.log('ui export !!!!');
      compressExport(msg.value, msg.filename)
        .then(() => {
          parent.postMessage({ pluginMessage: { type: 'close' } }, '*');
        });
    }
  
    if (msg.type === 'xaml-code') {

      /*
      let zip = new JSZip();
      zip.file('hello.txt', 'good');
      zip.generateAsync({ type: 'blob' })
      .then((content) => {
        const blobURL = window.URL.createObjectURL(content);
        const link = document.createElement('a');
        link.className = 'button button-primary';
        link.href = blobURL;
        link.download = `good.zip`
        link.click()
        link.setAttribute('download', `good2.zip`);
      })
      */

        //const codeElement = document.getElementById('mytextarea');
        //codeElement.innerText = msg.filename;

        console.log('ui kth');
        console.log('ui xaml'+ msg.filename);  
        xamlCode = msg.filename;      
        this.applyXamlCode(xamlCode);
        //this.reactfunction();
       
    }
  }

  onSelect(value: string) {
    this.setState({ convention: value });
  }

  onTextChange(value : string) {
      console.log('kth text area is changed!');
      console.log(xamlCode)
  //    this.forceUpdate();
  }

  onExport() {
    this.setState({ loading: true });
    const pluginMessage = { type: 'export', value: this.state.convention };
    parent.postMessage({ pluginMessage: pluginMessage }, '*');
    this.reactfunction();
  }

  onToXaml() {
    const pluginMessage = { type: 'to-xaml' };
    parent.postMessage({ pluginMessage: pluginMessage }, '*');
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
          <SectionTitle>Naming Convention</SectionTitle>
          <Select id="convention" options={options} defaultValue={defaultOption} onChange={this.onSelect} />
          <Button id="export" variant="secondary" fullWidth onClick={this.onExport}>Export</Button>
          <button className="brand" onClick={this.onToXaml}>
          Create
          </button>
          <TextArea id="xamlCodeArea" value = {this.state.xamlCode} onChange={this.onTextChange}/>
        </div>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('plugin'));