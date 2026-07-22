import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { BootstrapVueNextResolver } from "unplugin-vue-components/resolvers";
import viteCompression from "vite-plugin-compression";
import "vue";

const viteCompressionFilter = /\.(js|mjs|json|css|html|svg)$/i;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load all env vars from `.env` (not only VITE_*)
    const env = loadEnv(mode, process.cwd(), "");
    const frontendPort = Number(env.DOCKGE_FRONTEND_PORT) || 5002;
    const backendPort = env.DOCKGE_PORT || "5001";

    return {
        server: {
            port: frontendPort,
            strictPort: true,
        },
        define: {
            "FRONTEND_VERSION": JSON.stringify(process.env.npm_package_version),
            "DOCKGE_DEV_BACKEND_PORT": JSON.stringify(backendPort),
        },
        root: "./frontend",
        build: {
            outDir: "../frontend-dist",
        },
        plugins: [
            vue(),
            Components({
                resolvers: [ BootstrapVueNextResolver() ],
            }),
            viteCompression({
                algorithm: "gzip",
                filter: viteCompressionFilter,
            }),
            viteCompression({
                algorithm: "brotliCompress",
                filter: viteCompressionFilter,
            }),
        ],
    };
});
