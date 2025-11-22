'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (decodedText: string) => void;
}

const qrcodeRegionId = 'html5qr-code-full-region';

export function ScannerDialog({ open, onOpenChange, onScanSuccess }: ScannerDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let html5Qrcode: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          const cameraId = devices.find(d => d.label.toLowerCase().includes('back'))?.id || devices[0].id;
          
          html5Qrcode = new Html5Qrcode(qrcodeRegionId);
          
          await html5Qrcode.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText, _decodedResult) => {
              onScanSuccess(decodedText);
              onOpenChange(false);
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

    const stopScanner = () => {
        if (html5Qrcode && html5Qrcode.isScanning) {
            html5Qrcode.stop().catch(err => console.error("Failed to stop scanner", err));
        }
    }
    
    // We need a timeout to allow the dialog to render before we try to access the DOM element
    const timeoutId = setTimeout(() => {
        const element = document.getElementById(qrcodeRegionId);
        if (element) {
            startScanner();
        }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      stopScanner();
    };
  }, [open, onOpenChange, onScanSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-full w-full p-0 m-0 flex flex-col">
        <div id={qrcodeRegionId} className="w-full flex-1"></div>
        {errorMessage && <div className="p-4 bg-destructive text-destructive-foreground text-center">{errorMessage}</div>}
      </DialogContent>
    </Dialog>
  );
}
