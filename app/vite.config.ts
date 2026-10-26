import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { validateApiBaseUrl } from './src/services/http/apiBase'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    __SFSTUDIO_API_BASE__: JSON.stringify(
      validateApiBaseUrl(loadEnv(mode, process.cwd(), 'VITE_').VITE_API_BASE_URL, mode),
    ),
    __SFSTUDIO_API_MODE__: JSON.stringify(mode),
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }

  
}))
