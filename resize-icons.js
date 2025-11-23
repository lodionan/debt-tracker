const sharp = require('sharp');

const sizes = [16, 32, 192, 512];

sizes.forEach(size => {
  sharp('public/newLogo.png')
    .resize(size, size)
    .png()
    .toFile(`public/icon${size}.png`)
    .then(() => console.log(`Generated icon${size}.png`))
    .catch(err => console.error(err));
});