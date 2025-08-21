import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    cssCodeSplit: true,
    lib: {
      entry: 'src/index.ts',
      name: 'TriplaCalendar',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) =>
        format === 'es' ? 'index.mjs' :
        format === 'cjs' ? 'index.cjs' :
        `index.${format}.js`,
    },
    rollupOptions: {
      external: ["dayjs", "date-holidays"],
      output: {
        globals: {
          dayjs: "dayjs",
          "date-holidays": "DateHolidays",
        },
      },
    },
    sourcemap: true,
  },
  plugins: [
    dts({
      insertTypesEntry: true, 
      rollupTypes: true
    }),
  ],
});
