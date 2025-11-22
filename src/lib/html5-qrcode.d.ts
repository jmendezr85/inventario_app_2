declare module 'html5-qrcode' {
  export interface Qrbox {
    width: number;
    height: number;
  }
  
  export interface CameraDevice {
      id: string;
      label: string;
  }

  export interface Html5QrcodeConfig {
    fps?: number;
    qrbox?: Qrbox | ((viewfinderWidth: number, viewfinderHeight: number) => Qrbox);
    aspectRatio?: number;
    disableFlip?: boolean;
    videoConstraints?: MediaTrackConstraints;
  }

  export class Html5Qrcode {
    constructor(elementId: string, verbose?: boolean);
    static getCameras(): Promise<CameraDevice[]>;
    start(
      cameraId: string | { facingMode: 'user' | 'environment' },
      configuration: Html5QrcodeConfig,
      qrCodeSuccessCallback: (decodedText: string, decodedResult: any) => void,
      qrCodeErrorCallback: (errorMessage: string) => void
    ): Promise<null>;
    stop(): Promise<void>;
    clear(): Promise<void>;
    getScanningStatus(): boolean;
    readonly isScanning: boolean;
  }
}
