import type { NextConfig } from 'next';
const nativeBuild=process.env.MYSUREGAS_NATIVE_EXPORT==='1';
const nextConfig:NextConfig={
 ...(nativeBuild?{output:'export' as const,trailingSlash:true,images:{unoptimized:true}}:{}),
};
export default nextConfig;
