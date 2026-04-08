Self-hosted font files go in this directory.

Required files (woff2 format):
  Manrope family (https://fonts.google.com/specimen/Manrope):
    - manrope-regular.woff2   (weight 400)
    - manrope-medium.woff2    (weight 500)
    - manrope-semibold.woff2  (weight 600)
    - manrope-bold.woff2      (weight 700)
    - manrope-extrabold.woff2 (weight 800)

  Outfit family (https://fonts.google.com/specimen/Outfit):
    - outfit-medium.woff2     (weight 500)
    - outfit-semibold.woff2   (weight 600)
    - outfit-bold.woff2       (weight 700)
    - outfit-extrabold.woff2  (weight 800)

Download steps:
  1. Visit https://gwfh.mranftl.com/fonts (google-webfonts-helper) or
     https://fonts.google.com and download each family.
  2. Select the required weights, choose woff2, and place files here.
  3. Remove this file once fonts are in place.

Until font files are present the browser will fall back to
"local()" declarations (uses the font if already installed on
the OS) and then to the generic system sans-serif.
