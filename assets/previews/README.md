# Link preview screenshots

`site.js` looks for `assets/previews/<key>.jpg` when you hover a link that
carries `data-preview="<key>"`. If the file isn't here, the card falls back to
a typographic panel — nothing breaks, it just looks plainer.

To add a real one:

1. Open the site at 1280×800 in your browser.
2. Screenshot just the page (macOS: ⌘⇧4, then Space, then click the window).
3. Crop to roughly 16:9 from the top, export at 600×338, save as `<key>.jpg`.

Keys currently wired up:

    github  linkedin  substack  resume   dex   trex   r42
    boardy  ccir      brown     othello  geodesic     website

`resume.jpg` is already here (rendered from page 1 of the PDF).
