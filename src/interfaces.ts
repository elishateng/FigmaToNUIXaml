  export interface UIState {
    loading: boolean;
    xamlCode: string;
    fileName: string;
  }
  
  export interface ExportableBytes {
    name: string;
    setting: ExportSettingsImage | ExportSettingsPDF | ExportSettingsSVG;
    bytes: Uint8Array;
    blobType: string;
    extension: string;
  }
  