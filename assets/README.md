# QuizHost application icon

`icon.svg` is the editable source. It uses the existing QuizHost four-color mark on the app's purple background.

- `icon.ico`: Windows icon containing 16, 24, 32, 48, 64, 128, and 256 pixel images.
- `icon.png`: 512 pixel preview.
- `../client/public/favicon.svg`: matching browser icon, copied from the SVG source.

After editing the SVG, run `npm run icons` from the project root, inspect the preview, and run `npm run package:win`. The generator uses the icon renderer supplied by electron-builder; its first run may download that build tool. Generated assets are checked in, so ordinary builds do not need to regenerate them.

The Windows build embeds the ICO into both the portable launcher and the application executable. It also copies the ICO to the packaged resources directory for the application window. Executable resource editing is enabled; code signing is disabled for this unsigned development build.

After packaging, run `node scripts/verify-package.cjs` and `node scripts/verify-windows-icons.cjs`. These inspect files and executable resources without launching the application.
