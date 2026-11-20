/** @type {import('next').NextConfig} */
const nextConfig = {
  // mysql2 只在服务端按需加载，不参与打包
  serverExternalPackages: ["mysql2"],
}

export default nextConfig
