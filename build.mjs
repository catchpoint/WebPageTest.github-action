#!/usr/bin/env node
import * as esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';

(async () => {
  await esbuild.build({
    entryPoints: ['index.js'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outdir: 'dist',
    minify: true,
    external: [
      './reporters/parallel-buffered',
      './worker.js',
    ],
    loader: {
      '.node': 'file'
    },
    plugins: [
        copy({
          // this is equal to process.cwd(), which means we use cwd path as base path to resolve `to` path
          // if not specified, this plugin uses ESBuild.build outdir/outfile options as base path.
          resolveFrom: 'cwd',
          assets: {
            from: ['./templates/*'],
            to: ['./dist/templates'],
          },
        }),
      ],
  });
})();