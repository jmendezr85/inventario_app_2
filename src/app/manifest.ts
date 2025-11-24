import { type MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Inventario',
    short_name: 'Inventario',
    description: 'Inventario para Productos',
    start_url: '/',
    display: 'standalone',
    background_color: '#E6EEFF',
    theme_color: '#2962FF',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
