const nextConfig = {
  experimental: {
    typedRoutes: false,
  },
  env: {
    NEXT_PUBLIC_HAS_OPENAI: process.env.OPENAI_API_KEY ? "true" : "",
  },
};

export default nextConfig;
