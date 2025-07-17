import type {NextConfig} from 'next';

const isGithubActions = process.env.GITHUB_ACTIONS === 'true'
const repoName = 'manga-marks'

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'export',
  trailingSlash: true, // Recommended for GitHub Pages
 images: {
    unoptimized: true, // Required for static export if using <Image>
  },
  // If you're using next-themes or other dynamic imports, you may need this
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
