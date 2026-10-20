'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, ImagePlus, ScanLine, X } from 'lucide-react';
import s from './staff-qr-scanner.module.css';

export function StaffQrScanner({ onDetected, onClose }: { onDetected: (token: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const frame = useRef<number | null>(null);
  const attempt = useRef(0);
  const alive = useRef(true);
  const busy = useRef(false);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const stop = useCallback(() => {
    attempt.current += 1;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    busy.current = false;
  }, []);
  useEffect(() => {
    alive.current = true;
    const pause = () => { if (document.hidden) { stop();setRunning(false);setLoading(false); } };
    document.addEventListener('visibilitychange', pause);
    return () => { alive.current = false; stop(); document.removeEventListener('visibilitychange', pause); };
  }, [stop]);
  const accept = (token: string) => {
    const value = token.trim();
    if (!value || value.length > 4096) { stop();setRunning(false);setLoading(false);setError('This QR does not contain a usable voucher token. Try the voucher code instead.');return false; }
    stop();setRunning(false);setLoading(false);onDetected(value);return true;
  };
  async function start(nextFacing = facing) {
    stop();setRunning(false);setError('');
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {setError('Camera access needs HTTPS or localhost. You can upload a QR image or enter the token manually.');return;}
    const ticket = attempt.current;busy.current = true;setLoading(true);
    try {
      const jsQR = (await import('jsqr')).default;
      if (!alive.current || ticket !== attempt.current) return;
      const camera = await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:nextFacing},width:{ideal:1280},height:{ideal:720}}});
      if (!alive.current || ticket !== attempt.current) {camera.getTracks().forEach(track=>track.stop());return;}
      stream.current = camera;
      const element = video.current;
      if (!element) {stop();return;}
      element.srcObject = camera;await element.play();
      if (!alive.current || ticket !== attempt.current) return;
      setLoading(false);setRunning(true);busy.current = false;
      const canvas = document.createElement('canvas');const context = canvas.getContext('2d',{willReadFrequently:true});
      if (!context) throw new Error('Canvas unavailable');
      let previous = 0;
      const scan = (time: number) => {
        if (!alive.current || ticket !== attempt.current) return;
        frame.current = requestAnimationFrame(scan);
        if (time-previous < 200 || element.readyState < 2 || !element.videoWidth) return;
        previous = time;
        const scale = Math.min(1,720/Math.max(element.videoWidth,element.videoHeight));
        canvas.width = Math.round(element.videoWidth*scale);canvas.height = Math.round(element.videoHeight*scale);
        try {
        context.drawImage(element,0,0,canvas.width,canvas.height);
        const pixels = context.getImageData(0,0,canvas.width,canvas.height);
        const qr = jsQR(pixels.data,canvas.width,canvas.height,{inversionAttempts:'attemptBoth'});
        if (qr) accept(qr.data);
        } catch {stop();setRunning(false);setLoading(false);setError('The camera image couldn’t be read. Try again or upload a QR image.');}
      };
      frame.current = requestAnimationFrame(scan);
    } catch (cause) {
      if (!alive.current || ticket !== attempt.current) return;
      stop();setLoading(false);setRunning(false);
      const name = cause instanceof Error ? cause.name : '';
      setError(name==='NotAllowedError' ? 'Camera permission was denied. Allow it in browser settings, or upload a QR image.' : name==='NotFoundError' ? 'No camera was found. Upload a QR image or enter the token manually.' : 'The camera couldn’t start. Close other camera apps and try again, or upload a QR image.');
    }
  }
  async function readImage(file: File) {
    stop();setRunning(false);setError('');
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size>8*1024*1024) {setError('Choose a PNG, JPEG, or WebP image smaller than 8 MB.');return;}
    const ticket = attempt.current;busy.current = true;setLoading(true);let image:ImageBitmap | null=null;
    try {
      const jsQR = (await import('jsqr')).default;image=await createImageBitmap(file);
      if (!alive.current || ticket!==attempt.current) return;
      if (image.width*image.height>20_000_000) throw new Error('Image too large');
      const scale=Math.min(1,1600/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);
      const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)throw new Error('Canvas unavailable');
      context.drawImage(image,0,0,canvas.width,canvas.height);const pixels=context.getImageData(0,0,canvas.width,canvas.height);const qr=jsQR(pixels.data,canvas.width,canvas.height,{inversionAttempts:'attemptBoth'});
      if (!qr) {setError('No QR code was found. Try a clear, close-up image with the entire QR code visible.');return;}
      accept(qr.data);
    } catch {if(alive.current && ticket===attempt.current)setError('This image couldn’t be read. Try a clear PNG or JPEG image of the QR code.');}
    finally {image?.close();if(alive.current && ticket===attempt.current){busy.current=false;setLoading(false);}}
  }
  return <section className={s.scanner} aria-label="Voucher QR scanner"><header><div><span className={s.icon}><ScanLine size={24} /></span><div><h2>Scan. Review. Redeem.</h2><p>Read the customer’s QR token with your camera or an image.</p></div></div><button type="button" aria-label="Close QR scanner" onClick={()=>{stop();onClose();}}><X size={20} /></button></header>
    <div className={s.view}><video ref={video} muted playsInline aria-label="Camera preview" className={running ? s.video : s.hidden} />{running ? <><div className={s.frame} aria-hidden="true"><span /></div><span className={s.live}>Camera active</span></> : <div className={s.placeholder}><ScanLine size={48} /><strong>{loading ? 'Getting ready…' : 'Bring the QR code into focus'}</strong><p>The token will fill the form for your review.</p></div>}</div>
    {error && <p role="alert" className={s.error}>{error}</p>}<div className={s.actions}>{running ? <><button type="button" onClick={()=>{stop();setRunning(false);setLoading(false);}}><CameraOff size={17} /> Stop camera</button><button type="button" onClick={()=>{const next=facing==='environment'?'user':'environment';setFacing(next);void start(next);}}>Switch camera</button></> : <button type="button" disabled={loading} onClick={()=>void start()}><Camera size={18} /> Start camera</button>}<label className={s.upload} aria-disabled={loading}><ImagePlus size={18} /> Upload QR image<input type="file" aria-label="Upload QR image" accept="image/png,image/jpeg,image/webp" disabled={loading} onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file && !busy.current)void readImage(file);}} /></label></div><p className={s.note}>Scanning and image reading happen on this device. Redemption happens only after you confirm.</p>
  </section>;
}
