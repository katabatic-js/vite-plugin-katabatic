# Katabatic vite plugin

vite plugin for [Katabatic](https://github.com/katabatic-js/katabatic)

## Getting started

```
npm i vite-plugin-katabatic -D
```

```
// vite.config.js
import { defineConfig } from 'vite'
import { katabatic } from 'vite-plugin-katabatic'

export default defineConfig({
  plugins: [katabatic()]
})
```