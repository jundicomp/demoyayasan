import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Path relatif: aman dipublikasikan di repo apa pun (mis. jundicomp.github.io/demospp/)
  // tanpa perlu ganti config lagi kalau nama repo berubah. Aman karena pakai HashRouter.
  base: './',
  define: {
    // Waktu SUNGGUHAN saat "npm run build" dijalankan -- ditanam permanen ke
    // bundle hasil build. Dipakai di footer sidebar supaya gampang cek "apakah
    // versi yang tayang ini benar-benar hasil build terbaru" tanpa nebak-nebak.
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
