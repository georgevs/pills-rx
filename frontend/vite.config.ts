import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    https: {
      cert: fs.readFileSync('./certs/cert.pem'),
      key: fs.readFileSync('./certs/cert-key-nopassword.pem')
    }
  },
  plugins: [react()],
})
