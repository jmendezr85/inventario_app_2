'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Html5Qrcode, type CameraDevice } from 'html5-qrcode';
import { Button } from '../ui/button';
import { Video, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface ScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (decodedText: string) => void;
}

const qrcodeRegionId = 'html5qr-code-full-region';

export function ScannerDialog({
  open,
  onOpenChange,
  onScanSuccess,
}: ScannerDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>();
  const [isScanning, setIsScanning] = useState(false);

  const stopScanner = useCallback(() => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      setIsScanning(false);
      return html5QrcodeRef.current.stop();
    }
    return Promise.resolve();
  }, []);

  const startScanner = useCallback(async (cameraId: string) => {
    if (!open || !document.getElementById(qrcodeRegionId)) return;
    
    html5QrcodeRef.current = new Html5Qrcode(qrcodeRegionId, false);
    
    try {
      await stopScanner(); // Make sure any previous scanner is stopped
      setIsScanning(true);
      await html5QrcodeRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
             const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
             const qrboxSize = Math.floor(minEdge * 0.8);
             return { width: qrboxSize, height: qrboxSize };
          },
          aspectRatio: 1.0,
        },
        (decodedText, _decodedResult) => {
          onScanSuccess(decodedText);
        },
        (error) => {
          // Do nothing, error is verbose
        }
      );
      setErrorMessage(null);
    } catch (err: any) {
        setIsScanning(false);
        setErrorMessage(`Error al iniciar escáner: ${err.message || 'Error desconocido.'}`);
    }
  }, [open, onScanSuccess, stopScanner]);
  
  useEffect(() => {
    if (open) {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length) {
            setCameras(devices);
            // Prefer back camera
            const backCamera = devices.find(d => d.label.toLowerCase().includes('back')) || devices[0];
            setSelectedCameraId(backCamera.id);
          } else {
            setErrorMessage('No se encontraron cámaras en este dispositivo.');
          }
        })
        .catch((err) => {
          setErrorMessage(`Error al acceder a las cámaras: ${err.message}`);
        });
    } else {
       stopScanner();
    }
     // Cleanup function
    return () => {
      stopScanner();
    };
  }, [open]);

  useEffect(() => {
    if (selectedCameraId) {
        startScanner(selectedCameraId);
    }
  }, [selectedCameraId, startScanner]);


  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-full w-full p-0 m-0 flex flex-col bg-black">
        <div className="relative w-full flex-1">
          <div id={qrcodeRegionId} className="w-full h-full" />
          
          {/* Scanner Overlay */}
          <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full flex items-center justify-center">
                  <div className="w-[80%] max-w-[400px] aspect-square relative">
                      <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
                      <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
                      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
                      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-xl"></div>

                      {isScanning && <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-scan-line"></div>}
                  </div>
              </div>
          </div>

          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white hover:text-white rounded-full"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {(errorMessage || cameras.length > 1) && (
            <div className="p-4 bg-background/80 backdrop-blur-sm space-y-2">
            {errorMessage && (
                <Alert variant="destructive">
                    <Video className="h-4 w-4" />
                    <AlertTitle>Error de Cámara</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}
            </div>
        )}
        <style jsx>{`
            @keyframes scan-line-animation {
                0% { transform: translateY(-120px); opacity: 0.5; }
                50% { transform: translateY(120px); opacity: 1; }
                100% { transform: translateY(-120px); opacity: 0.5; }
            }
            .animate-scan-line {
                animation: scan-line-animation 2s infinite ease-in-out;
            }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}

// React.useCallback is used to memoize functions
const { useCallback } = require('react');
