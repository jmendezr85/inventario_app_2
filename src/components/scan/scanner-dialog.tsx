'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Html5Qrcode, type CameraDevice } from 'html5-qrcode';
import { Button } from '../ui/button';
import { Video, X, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

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
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  
  const isHandlingSuccessRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.error("Scanner stop failed, but proceeding.", err);
      }
    }
  }, []);

  const handleScanSuccess = useCallback((decodedText: string) => {
      if (isHandlingSuccessRef.current) return;

      isHandlingSuccessRef.current = true;
      onScanSuccess(decodedText);
      setShowSuccessOverlay(true);

      setTimeout(() => {
          setShowSuccessOverlay(false);
          // Allow the scanner to start again after the cooldown
          isHandlingSuccessRef.current = false;
      }, 500); 
  }, [onScanSuccess]);

  useEffect(() => {
    if (!open) {
      stopScanner();
      return;
    }

    const container = document.getElementById(qrcodeRegionId);
    if (!container) return;

    if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode(qrcodeRegionId, { verbose: false });
    }
    const scanner = html5QrcodeRef.current;
    
    let isMounted = true;
    let localScanner: Html5Qrcode | null = scanner;

    const startScanner = async (cameraId: string) => {
      if (!localScanner || localScanner.isScanning || isHandlingSuccessRef.current) {
        return;
      }
      
      try {
        setErrorMessage(null);
        await localScanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                const qrboxSize = Math.floor(minEdge * 0.85);
                return { width: qrboxSize, height: qrboxSize };
            },
            aspectRatio: 1.0,
          },
          handleScanSuccess,
          (error) => { /* Verbose scan errors, ignored */ }
        );
      } catch (err: any) {
        if (!isMounted) return;
        if (err.name === 'NotAllowedError') {
            setErrorMessage('Permiso de cámara denegado. Por favor, habilítalo en los ajustes de tu navegador.');
        } else {
            setErrorMessage(`Error al iniciar el escaner: ${err.name || 'Error desconocido'}`);
        }
      }
    };

    if (cameras.length === 0) {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (!isMounted) return;
          if (devices && devices.length) {
            setCameras(devices);
            const backCamera = devices.find(d => d.label.toLowerCase().includes('back')) || devices[0];
            if (!selectedCameraId) {
                setSelectedCameraId(backCamera.id);
            }
          } else {
            setErrorMessage('No se encontraron cámaras en este dispositivo.');
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          if (err.name === 'NotAllowedError') {
              setErrorMessage('Permiso de cámara denegado. Por favor, habilítalo en los ajustes de tu navegador.');
          } else {
               setErrorMessage(`No se pudo acceder a las cámaras: ${err.message}`);
          }
        });
    }

    if (selectedCameraId) {
      // Stop previous scanner instance before starting new one
      if (localScanner.isScanning) {
          stopScanner().then(() => startScanner(selectedCameraId));
      } else {
          startScanner(selectedCameraId);
      }
    }

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [open, selectedCameraId, cameras.length, stopScanner, handleScanSuccess]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-full w-full p-0 m-0 flex flex-col bg-black border-0">
        <DialogTitle className="sr-only">Escáner de código de barras</DialogTitle>
        <div className="relative w-full flex-1">
          <div id={qrcodeRegionId} className="w-full h-full" />
          
          <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full flex items-center justify-center">
                  <div className="w-[80vw] max-w-[400px] aspect-square relative">
                      <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-xl transition-all duration-300"></div>
                      <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-xl transition-all duration-300"></div>
                      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-xl transition-all duration-300"></div>
                      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-xl transition-all duration-300"></div>

                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/70 shadow-[0_0_10px_0_rgba(255,0,0,0.7)] animate-scan-line"></div>
                  </div>
              </div>
          </div>
          
          <div className={cn(
              "absolute inset-0 flex items-center justify-center bg-green-500/20 transition-opacity duration-300 pointer-events-none",
              showSuccessOverlay ? "opacity-100" : "opacity-0"
          )}>
              <CheckCircle className="h-32 w-32 text-white drop-shadow-lg" />
          </div>


          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white hover:text-white rounded-full z-20"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {(errorMessage || cameras.length > 1) && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/70 backdrop-blur-sm space-y-2 z-10 rounded-t-lg">
            {errorMessage && (
                <Alert variant="destructive">
                    <Video className="h-4 w-4" />
                    <AlertTitle>Error de Cámara</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}
             {cameras.length > 1 && (
                <Select value={selectedCameraId} onValueChange={setSelectedCameraId}>
                    <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Seleccionar cámara" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        {cameras.map(camera => (
                            <SelectItem key={camera.id} value={camera.id} className="focus:bg-gray-700">{camera.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
             )}
            </div>
        )}
        <style jsx>{`
            #html5qr-code-full-region video {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover;
            }
            @keyframes scan-line-animation {
                0% { transform: translateY(-140px); }
                50% { transform: translateY(140px); }
                100% { transform: translateY(-140px); }
            }
            .animate-scan-line {
                animation: scan-line-animation 2.5s infinite ease-in-out;
            }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
