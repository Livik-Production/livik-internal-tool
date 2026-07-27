// @type {import('next').NextConfig} 
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '40ipqonywx0hu3xn.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'zfz4ipyerygz13ql.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'liviktech-resumes.s3.ap-south-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],
};
 
export default nextConfig;
 