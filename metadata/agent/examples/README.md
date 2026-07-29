# KERN compile-verified examples

This directory contains one self-contained standalone Angular application source for every public
catalog entry. Each source imports KERN from its canonical owner entrypoint and is AOT-compiled
against the packed npm artifact by:

```sh
node tools/verify-kern-agent-dx.mjs
```

The registry is closed by design: adding a catalog item without an explicit recipe fails generation.
Load `@kern-ui/angular/styles/kern.css` once in the consuming application's global styles.
