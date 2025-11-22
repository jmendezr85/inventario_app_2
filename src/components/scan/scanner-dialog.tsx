'use client';

import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Html5Qrcode, type Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '../ui/button';

interface ScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (decodedText: string) => void;
}

const qrcodeRegionId = 'html5qr-code-full-region';

export function ScannerDialog({ open, onOpenChange, onScanSuccess }: ScannerDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!open) {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
      }
      return;
    }

    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          const cameraId = devices.find(d => d.label.toLowerCase().includes('back'))?.id || devices[0].id;
          
          html5QrcodeRef.current = new Html5Qrcode(qrcodeRegionId);
          
          await html5QrcodeRef.current.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText, _decodedResult) => {
              onScanSuccess(decodedText);
              // We don't close the dialog anymore: onOpenChange(false);
            },
            (error) => {
                // Do nothing on scan error, it's noisy
            }
          );
          setErrorMessage(null);
        } else {
            setErrorMessage("No cameras found on this device.");
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to start scanner.');
      }
    };
    
    // We need a timeout to allow the dialog to render before we try to access the DOM element
    const timeoutId = setTimeout(() => {
        const element = document.getElementById(qrcodeRegionId);
        if (element) {
            startScanner();
        }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current.stop().catch(err => console.error("Failed to stop scanner cleanly", err));
      }
    };
  }, [open, onScanSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-full w-full p-0 m-0 flex flex-col">
        <div id={qrcodeRegionId} className="w-full flex-1"></div>
        {errorMessage && <div className="p-4 bg-destructive text-destructive-foreground text-center">{errorMessage}</div>}
        <DialogFooter className="p-2 bg-background/80 backdrop-blur-sm">
            <Button onClick={() => onOpenChange(false)} className="w-full">Cerrar Escáner</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
