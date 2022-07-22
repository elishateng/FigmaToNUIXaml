import React from 'react';
import ReactDOM from 'react-dom';

import { Select, Button, SectionTitle, TextArea } from 'figma-styled-components';
import { UISelectOption as Option, UIState as State} from "./interfaces";
import { CONVENTIONS, ORIGINAL } from './constants';
import { compressExport } from "./ui/exporter";

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
      convention: ORIGINAL
    }

    this.onSelect = this.onSelect.bind(this);
    this.onExport = this.onExport.bind(this);

    window.addEventListener("message", this.handleMessage);
  }

  handleMessage(event) {
    console.log('good!!!!!!!!!!');
    const msg = event.data.pluginMessage;
    if (!msg) return;
  
    if (msg.type === 'exportResults') {
      compressExport(msg.value, msg.filename)
        .then(() => {
          parent.postMessage({ pluginMessage: { type: 'close' } }, '*');
        });
    }
  
    if (msg.type === 'xaml-code') {

        //const codeElement = document.getElementById('mytextarea');
        //codeElement.innerText = msg.filename;

        console.log('ui kth');
        console.log('ui xaml'+ msg.filename);  
        xamlCode = msg.filename;      
    }
  }

  onSelect(value: string) {
    this.setState({ convention: value });
  }

  onTextChange() {
      console.log('kth text area is changed!');
      console.log(xamlCode);
      this.forceUpdate();
  }

  onExport() {
    this.setState({ loading: true });
    const pluginMessage = { type: 'export', value: this.state.convention };
    parent.postMessage({ pluginMessage: pluginMessage }, '*');
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
          <TextArea value = {xamlCode} onChange={this.onTextChange}/>
        </div>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('plugin'));