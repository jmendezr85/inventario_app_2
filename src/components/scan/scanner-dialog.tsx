'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Html5Qrcode, type CameraDevice } from 'html5-qrcode';
import { Button } from '../ui/button';
import { Video, X, CheckCircle, Loader2 } from 'lucide-react';
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

type ScanningStatus = 'stopped' | 'starting' | 'scanning' | 'error';
const SCANNER_ELEMENT_ID = 'html5qr-code-full-region';


export function ScannerDialog({
  open,
  onOpenChange,
  onScanSuccess,
}: ScannerDialogProps) {
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>();
  const [status, setStatus] = useState<ScanningStatus>('stopped');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const isHandlingSuccessRef = useRef(false);

  const handleScanSuccess = useCallback((decodedText: string) => {
    if (isHandlingSuccessRef.current) return;
    isHandlingSuccessRef.current = true;
    
    onScanSuccess(decodedText);
    setShowSuccessOverlay(true);

    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    setTimeout(() => {
      setShowSuccessOverlay(false);
      isHandlingSuccessRef.current = false;
    }, 500);
  }, [onScanSuccess]);
  
  const stopScanner = useCallback(async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        setStatus('stopped');
        try {
            await html5QrcodeRef.current.stop();
        } catch (err) {
            console.error('Failed to stop the scanner gracefully:', err);
        }
    }
  }, []);


  const startScanner = useCallback(async () => {
      if (status !== 'stopped' || !open) return;
      
      setStatus('starting');
      setErrorMessage(null);
      
      if (!html5QrcodeRef.current) {
        // Initialize here, only once.
        html5QrcodeRef.current = new Html5Qrcode(SCANNER_ELEMENT_ID, false);
      }
      
      const scanner = html5QrcodeRef.current;

      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          setCameras(devices);
          
          let camId = selectedCameraId;
          if (!camId) {
              const backCam = devices.find(d => d.label.toLowerCase().includes('back'));
              camId = (backCam || devices[0]).id;
              setSelectedCameraId(camId);
          }

          await scanner.start(
            camId,
            {
              fps: 10,
              qrbox: (w, h) => ({ width: Math.min(w, h) * 0.8, height: Math.min(w, h) * 0.4 }),
              aspectRatio: 1.7777778,
            },
            handleScanSuccess,
            () => {}
          );
          setStatus('scanning');
        } else {
           throw new Error('No se encontraron cámaras en este dispositivo.');
        }
      } catch (err: any) {
         console.error("Error starting scanner:", err);
         let message = `Error al iniciar el escaner: ${err.message || 'Could not start video source'}`;
         if (err.name === 'NotAllowedError') {
          message = 'Permiso de cámara denegado. Por favor, habilítalo en los ajustes de tu navegador.';
         }
         setErrorMessage(message);
         setStatus('error');
         await stopScanner();
      }
    }, [handleScanSuccess, selectedCameraId, status, open, stopScanner]);


  useEffect(() => {
    if (open) {
      startScanner();
    }
    
    return () => {
        stopScanner();
    };
  }, [open, selectedCameraId, startScanner, stopScanner]);


  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-full h-full w-full p-0 m-0 flex flex-col bg-black border-0">
        <DialogTitle className="sr-only">Escáner de código de barras</DialogTitle>
        <div className="relative w-full flex-1">
          <div id={SCANNER_ELEMENT_ID} className="w-full h-full" />
          
          <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full flex items-center justify-center">
                  <div className="w-[80vw] max-w-[400px] h-[40vw] max-h-[200px] relative">
                      <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
                      <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
                      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
                      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
                      {status === 'scanning' && <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/70 shadow-[0_0_10px_0_rgba(255,0,0,0.7)] animate-scan-line"></div>}
                  </div>
              </div>
          </div>

          {status === 'starting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <p>Iniciando cámara...</p>
            </div>
          )}
          
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

        {(status === 'error' || (status !== 'starting' && cameras.length > 1)) && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/70 backdrop-blur-sm space-y-2 z-10 rounded-t-lg">
            {status === 'error' && errorMessage && (
                <Alert variant="destructive">
                    <Video className="h-4 w-4" />
                    <AlertTitle>Error de Cámara</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}
             {cameras.length > 1 && (
                <Select value={selectedCameraId} onValueChange={setSelectedCameraId} disabled={status === 'scanning'}>
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
            div#${SCANNER_ELEMENT_ID} video {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover;
            }
            @keyframes scan-line-animation {
                0% { transform: translateY(-10vh); }
                50% { transform: translateY(10vh); }
                100% { transform: translateY(-10vh); }
            }
            .animate-scan-line {
                animation: scan-line-animation 2.5s infinite ease-in-out;
            }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
