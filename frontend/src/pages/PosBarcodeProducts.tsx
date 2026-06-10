import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PRODUCTS } from '../constants';
import { SectionHeader } from '../components/UI';
import { ArrowLeft } from 'lucide-react';
import { API_BASE } from '../api';
import JsBarcode from 'jsbarcode';
import { resolveImageUrl, getCategoryFallbackImage } from '../utils/media';

export const PosBarcodeProducts = () => {
  const [products, setProducts] = useState<any[]>(PRODUCTS);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    fetch(`${API_BASE}/api/products`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && data.length > 0 && setProducts(data))
      .catch(() => null);
    fetch(`${API_BASE}/api/settings`)
      .then((r) => r.json())
      .then((data) => data && Object.keys(data).length > 0 && setSettings(data))
      .catch(() => null);
  }, []);

  const selectedCategories = Array.isArray(settings.posBarcodeCategories) && settings.posBarcodeCategories.length > 0
    ? settings.posBarcodeCategories.map((c: string) => c.toLowerCase())
    : ['paper products', 'thermal labels'];

  const categoryProducts = products.filter((p) => {
    const value = String(p.category || '').toLowerCase();
    return selectedCategories.includes(value);
  });

  const PosProductCard = ({ product }: { product: any; key?: any }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const barcodeValue = product.sku || product.barcodeValue || product._id || product.id || '';
    useEffect(() => {
      if (!svgRef.current || !barcodeValue) return;
      try {
        JsBarcode(svgRef.current, String(barcodeValue), {
          format: 'CODE128',
          displayValue: false,
          height: 50,
          width: 2,
          margin: 0
        });
      } catch {
        // ignore render errors
      }
    }, [barcodeValue]);

    const rawImage = product.image || product.images?.[0] || getCategoryFallbackImage(product.category);
    const image = resolveImageUrl(rawImage);
    const isDocxImage = String(rawImage).startsWith('/assets/docx/');

    return (
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
        <div className={`aspect-[4/3] overflow-hidden ${isDocxImage ? 'bg-white' : ''}`}>
          <img
            src={image}
            alt={product.name}
            className={`w-full h-full ${isDocxImage ? 'object-cover object-top scale-105' : 'object-cover'}`}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-lg font-display font-bold text-primary mb-2">{product.name}</h3>
          <p className="text-sm text-slate-600 mb-3 flex-grow">{product.description}</p>
          <div className="text-xs text-slate-500 space-y-1 mb-4">
            <div>Price: <span className="font-semibold text-slate-700">₹{product.price ?? 0}</span></div>
            <div>SKU: <span className="font-semibold text-slate-700">{product.sku || product._id || '-'}</span></div>
          </div>
          <div className="border border-slate-200 rounded-lg p-2 flex items-center justify-center mb-4 bg-white">
            <svg ref={svgRef} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to={`/products/${product._id || product.id}`}
              className="py-2.5 rounded-lg text-sm font-semibold text-primary border border-slate-200 hover:bg-slate-50 transition-colors text-center"
            >
              Learn More
            </Link>
            <Link
              to={`/pos-label?productId=${product._id || product.id}`}
              className="py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors text-center"
            >
              View Barcode Label
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-24 min-h-screen bg-slate-50">
      {/* Header */}
      <section className="bg-primary py-12 md:py-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img
            src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80"
            alt="POS barcode products"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/products" className="inline-flex items-center text-sm text-slate-300 hover:text-white mb-6">
            <ArrowLeft size={16} className="mr-2" />
            Back to Categories
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-3">POS Paper Roll and Barcode Labels</h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl">
            Explore POS paper rolls, barcode labels, and related supplies for retail and enterprise operations.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 bg-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="POS Paper Roll and Barcode Labels"
            subtitle="Explore the full range of products in this section."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {categoryProducts.map((product) => (
              <PosProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
