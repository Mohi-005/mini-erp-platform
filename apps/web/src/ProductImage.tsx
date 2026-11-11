import React, { useState } from 'react';
import {
  getProductImageUrl,
  type CatalogueProduct,
  type Product,
} from '@mini-erp/shared';

export type ProductImageSize = 'thumb' | 'sm' | 'md' | 'lg' | 'xl';

interface ProductImageProps {
  product?:
    | Partial<Product>
    | Partial<CatalogueProduct>
    | {
        image_path?: string | null;
        code?: string | null;
        sku?: string | null;
        name_bn?: string | null;
        name_en?: string | null;
        name_banglish?: string | null;
      }
    | null;
  size?: ProductImageSize;
  alt?: string;
  className?: string;
}

const SIZE_CONFIG: Record<
  ProductImageSize,
  { width: number; height: number; className: string }
> = {
  thumb: { width: 38, height: 38, className: 'product-img-thumb' },
  sm: { width: 48, height: 48, className: 'product-img-sm' },
  md: { width: 76, height: 76, className: 'product-img-md' },
  lg: { width: 96, height: 96, className: 'product-img-lg' },
  xl: { width: 128, height: 128, className: 'product-img-xl' },
};

export function ProductImage({
  product,
  size = 'thumb',
  alt,
  className = '',
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const config = SIZE_CONFIG[size];
  const imageUrl = getProductImageUrl(product);
  const altText = alt || product?.name_bn || 'পণ্যের ছবি';

  if (!imageUrl || failed) {
    return (
      <div
        className={`product-img-fallback ${config.className} ${className}`.trim()}
        style={{ width: config.width, height: config.height }}
        aria-label={altText}
        role="img"
      >
        <span className="product-img-fallback-icon" aria-hidden="true">
          📦
        </span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={altText}
      loading="lazy"
      className={`product-img ${config.className} ${className}`.trim()}
      style={{
        width: config.width,
        height: config.height,
        objectFit: 'contain',
      }}
      onError={() => setFailed(true)}
    />
  );
}
