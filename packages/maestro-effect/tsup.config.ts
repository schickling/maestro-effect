import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    shims: true,
    external: ['effect', '@effect/cli', '@effect/platform', '@effect/platform-node'],
    noExternal: ['yaml'],
  },
  {
    entry: { cli: 'src/cli/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: false,
    shims: true,
    external: ['effect', '@effect/cli', '@effect/platform', '@effect/platform-node'],
    noExternal: ['yaml'],
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
])