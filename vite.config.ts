import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'TriplaCalendar',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) =>
        format === 'es' ? 'index.mjs' :
        format === 'cjs' ? 'index.cjs' :
        `index.${format}.js`,
    },
    sourcemap: true,
    rollupOptions: {
      external: ["dayjs", "date-holidays"],
      output: {
        globals: {
          dayjs: "dayjs",
          "date-holidays": "DateHolidays",
        },
      },
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true, 
      rollupTypes: true
    }),
  ],
});
