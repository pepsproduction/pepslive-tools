# Third-party sources

- [React Three Fiber](https://github.com/pmndrs/react-three-fiber): @react-three/fiber 9.8.2, React renderer for Three.js. Package licenses are included with installed dependencies.
- [Shader Gradient](https://github.com/ruucm/shadergradient): @shadergradient/react 2.4.20, animated hero background.
- [Liquid Glass JS](https://github.com/dashersw/liquid-glass-js): vendored `container.js`, commit `78cb6ccb0b9987bb60a88b14ccbd13a9e6e8ab2a`. MIT license retained at `src/vendor/liquid-glass/LICENSE`.

## Liquid Glass changes

Export Container as an ES module. Reduce blur and gradient sampling loops to lower GPU cost. The local `CanvasGlass` subclass overrides capture/lifecycle code to use a crop of the live Shader Gradient canvas instead of html2canvas, throttles updates to roughly 12.5 fps, skips offscreen updates, and disposes GPU resources on cleanup. The upstream refraction and masking equations are retained.

The resulting glass samples the gradient layer only, not arbitrary HTML or the foreground Three.js scene. It is an adapted integration, not a claim that upstream provides this React/live-canvas adapter out of the box.

Prompt and Barlow Condensed fonts are bundled through Fontsource packages. Brand art and portfolio thumbnails are existing PepsProduction materials used for this prototype; their presence does not grant third parties reuse rights. Content links are copied from the repository's public site-content.json.
