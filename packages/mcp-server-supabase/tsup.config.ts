import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: [
      'src/index.ts',
      'src/transports/stdio-selfhosted.ts',
      'src/platform/index.ts',
      'src/platform/selfhosted-platform.ts',
    ],
    format: ['cjs', 'esm'],
    outDir: 'dist',
    sourcemap: true,
    dts: true,
    minify: true,
    splitting: true,
    loader: {
      '.sql': 'text',
    },
  },
]);
