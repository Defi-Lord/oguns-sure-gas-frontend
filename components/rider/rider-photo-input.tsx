'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import s from './rider-actions.module.css';
export function RiderPhotoInput(){
 const [preview,setPreview]=useState('');const [error,setError]=useState('');
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
 return <div className={s.photo}><label><Camera size={15}/> Cylinder photo (optional)<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e=>{const f=e.target.files?.[0];setError('');setPreview('');if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024){setError('Choose a JPEG, PNG or WebP photo, 5 MB or smaller.');e.target.value='';return;}setPreview(URL.createObjectURL(f));}}/></label><p className={s.hint}>Photograph the cylinder and scale reading. Your camera or photo picker opens depending on your device. The photo uploads when you confirm the measurement.</p>{error&&<p className={s.error} role="alert">{error}</p>}{preview&&<Image src={preview} width={320} height={200} unoptimized alt="Selected cylinder photo preview" className={s.photoPreview}/>}</div>;
}
