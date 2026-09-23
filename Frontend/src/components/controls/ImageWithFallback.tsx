import { useState, type ImgHTMLAttributes } from "react";

export function ImageWithFallback(props: ImgHTMLAttributes<HTMLImageElement>) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        style={props.style}
        className={props.className}
        aria-label={props.alt}
        role="img"
      />
    );
  }

  return <img {...props} onError={() => setError(true)} />;
}
