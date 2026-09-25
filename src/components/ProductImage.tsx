"use client";

import React, { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

interface ProductImageProps extends Omit<ImageProps, "onError"> {
  fallbackText?: string;
  fallbackClassName?: string;
}

export function ProductImage({
  src,
  alt,
  fallbackText = "N/A",
  fallbackClassName = "",
  className = "",
  unoptimized = true,
  ...rest
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state if image source changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const isEmpty = !src || typeof src !== "string" || src.trim() === "";

  if (isEmpty || hasError) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center text-[var(--muted-ink)] text-xs font-mono select-none bg-[var(--bg)] ${fallbackClassName}`}
        aria-hidden="true"
      >
        {fallbackText}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      unoptimized={unoptimized}
      onError={() => setHasError(true)}
      {...rest}
    />
  );
}
