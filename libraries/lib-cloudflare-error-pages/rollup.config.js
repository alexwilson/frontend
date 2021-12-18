import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from "rollup-plugin-terser"

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/main.js',
    format: 'esm'
  },
  plugins: [ commonjs(), resolve(), terser() ]
}