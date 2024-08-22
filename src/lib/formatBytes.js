const i18next = require('i18next');

function formatBytes(bytes, sizes) {
  if (bytes === 0) return '0 Bytes';

//   const sizes = i18next.t('common.sizes', { returnObjects: true });
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const formattedSize = parseFloat((bytes / Math.pow(1024, i)).toFixed(2));

  return `${formattedSize}${sizes[i]}`;
}

module.exports = {
  formatBytes
};