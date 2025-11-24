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
  const [isScanning, setIsScanning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const stopScanner = useCallback(async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning && !isStopping) {
      setIsStopping(true);
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.error("Failed to stop scanner cleanly", err);
      } finally {
        setIsScanning(false);
        setIsStopping(false);
        // Do not nullify ref here to allow restart
      }
    }
  }, [isStopping]);


  const handleScanSuccess = useCallback((decodedText: string) => {
      onScanSuccess(decodedText);
      setShowSuccessOverlay(true);
      
      if(successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      
      successTimeoutRef.current = setTimeout(() => {
        setShowSuccessOverlay(false);
      }, 500);

  }, [onScanSuccess]);


  const startScanner = useCallback(async (cameraId: string) => {
    if (!open || isScanning || !document.getElementById(qrcodeRegionId)) return;
    
    // Ensure we have a fresh instance if it was stopped completely
    if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode(qrcodeRegionId, false);
    }
    
    const newScanner = html5QrcodeRef.current;
    if (newScanner.isScanning) {
        return;
    }
    
    try {
      setIsScanning(true);
      setErrorMessage(null);
      await newScanner.start(
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
        handleScanSuccess,
        (error) => {
          // Do nothing on error, it's verbose
        }
      );
    } catch (err: any) {
        setIsScanning(false);
        if (err.name === 'NotAllowedError') {
            setErrorMessage('Permiso de cámara denegado. Por favor, habilítalo en los ajustes de tu navegador.')
        } else {
            setErrorMessage(`Error al iniciar escáner: ${err.message || 'Error desconocido.'}`);
        }
    }
  }, [open, isScanning, handleScanSuccess]);
  
  useEffect(() => {
    if (open) {
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
          setErrorMessage(`No se pudo acceder a las cámaras: ${err.message}`);
        });
    } else {
       stopScanner();
    }
  }, [open]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
        if (successTimeoutRef.current) {
            clearTimeout(successTimeoutRef.current);
        }
        stopScanner();
    }
  }, [stopScanner]);

  useEffect(() => {
    if (open && selectedCameraId) {
        // If we switch camera, we need to stop the old one first
        if (html5QrcodeRef.current?.isScanning) {
            stopScanner().then(() => {
                startScanner(selectedCameraId);
            });
        } else {
            startScanner(selectedCameraId);
        }
    }
  }, [open, selectedCameraId, startScanner, stopScanner]);


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
          
          {/* Success Overlay */}
          <div className={cn(
              "absolute inset-0 bg-green-500/80 flex items-center justify-center transition-opacity duration-300",
              showSuccessOverlay ? "opacity-100" : "opacity-0 pointer-events-none"
          )}>
              <CheckCircle className="h-32 w-32 text-white" />
          </div>


          <Button
            onClick={handleClose}
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
                <Select value={selectedCameraId} onValueChange={setSelectedCameraId} disabled={isScanning && !isStopping}>
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
