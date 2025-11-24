'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
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
  
  // Ref to prevent multiple success triggers for a single scan
  const isHandlingSuccessRef = useRef(false);

  // Stop scanner function
  const stopScanner = useCallback(async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        // This can fail if the scanner is already stopped or in a weird state.
        // We can ignore it as our goal is to ensure it's stopped.
        console.error("Scanner stop failed, but proceeding.", err);
      }
    }
  }, []);

  // Handle successful scan
  const handleScanSuccess = useCallback((decodedText: string) => {
      // Prevent multiple calls for the same scan
      if (isHandlingSuccessRef.current) return;

      isHandlingSuccessRef.current = true;
      onScanSuccess(decodedText);
      setShowSuccessOverlay(true);

      setTimeout(() => {
          setShowSuccessOverlay(false);
          isHandlingSuccessRef.current = false;
      }, 500); // Cooldown period to prevent instant re-scans
  }, [onScanSuccess]);


  // Effect to initialize and manage the scanner lifecycle
  useEffect(() => {
    if (!open) {
      stopScanner();
      return;
    }

    // Ensure the container element exists
    const container = document.getElementById(qrcodeRegionId);
    if (!container) return;

    // Initialize scanner instance if it doesn't exist
    if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode(qrcodeRegionId, false);
    }
    const scanner = html5QrcodeRef.current;
    
    let didStart = false;

    const start = async () => {
        if (!selectedCameraId || (scanner.isScanning && didStart)) return;

        await stopScanner(); // Ensure any previous session is stopped

        try {
            setErrorMessage(null);
            await scanner.start(
                selectedCameraId,
                {
                    fps: 10,
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        const qrboxSize = Math.floor(minEdge * 0.8);
                        return { width: qrboxSize, height: qrboxSize };
                    },
                    aspectRatio: 1.0,
                },
                handleScanSuccess,
                (error) => { /* Scan errors are verbose, ignore them */ }
            );
            didStart = true;
        } catch (err: any) {
            if (err.name === 'NotAllowedError') {
                setErrorMessage('Permiso de cámara denegado. Por favor, habilítalo en los ajustes de tu navegador.');
            } else {
                console.error("Scanner start error:", err);
            }
        }
    };

    if (!cameras.length) {
        Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length) {
            setCameras(devices);
            if (!selectedCameraId) {
                const backCamera = devices.find(d => d.label.toLowerCase().includes('back')) || devices[0];
                setSelectedCameraId(backCamera.id);
            }
          } else {
            setErrorMessage('No se encontraron cámaras en este dispositivo.');
          }
        })
        .catch((err) => {
            if (err.name === 'NotAllowedError') {
                setErrorMessage('Permiso de cámara denegado. Por favor, habilítalo en los ajustes de tu navegador.');
            } else {
                 setErrorMessage(`No se pudo acceder a las cámaras: ${err.message}`);
            }
        });
    } else {
        start();
    }

    // Cleanup on effect change or unmount
    return () => {
      if (didStart) {
        stopScanner();
      }
    };
  }, [open, selectedCameraId, cameras, stopScanner, handleScanSuccess]);


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

                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-scan-line"></div>
                  </div>
              </div>
          </div>
          
          {/* Success Overlay */}
          <div className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none",
              showSuccessOverlay ? "opacity-100" : "opacity-0"
          )}>
              <CheckCircle className="h-32 w-32 text-green-500 drop-shadow-lg" />
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
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/50 backdrop-blur-sm space-y-2 z-10">
            {errorMessage && (
                <Alert variant="destructive">
                    <Video className="h-4 w-4" />
                    <AlertTitle>Error de Cámara</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}
             {cameras.length > 1 && (
                <Select value={selectedCameraId} onValueChange={setSelectedCameraId}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar cámara" />
                    </SelectTrigger>
                    <SelectContent>
                        {cameras.map(camera => (
                            <SelectItem key={camera.id} value={camera.id}>{camera.label}</SelectItem>
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
