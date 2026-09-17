"use client";

import Image, { type ImageProps } from 'next/image';
import { useEffect, useRef, useState } from 'react';

function ImageWithSkeleton({ className = '', onLoad, onError, ...props }: ImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ref.current?.complete) setReady(true);
  }, []);
  return <Image {...props} ref={ref} className={`${className}${ready ? '' : ' telemed-image-pending'}`}
    onLoad={event => { setReady(true); onLoad?.(event); }}
    onError={event => { setReady(true); onError?.(event); }} />;
}

export default function LoadingImage(props: ImageProps) {
  const source = typeof props.src === 'string' ? props.src : 'src' in props.src ? props.src.src : props.src.default.src;
  return <ImageWithSkeleton key={source} {...props} />;
}
