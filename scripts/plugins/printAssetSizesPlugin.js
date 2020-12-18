function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) {
    return '0B';
  }
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const bucketIndex = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, bucketIndex)).toFixed(decimals < 0 ? 0 : decimals)) + ' ' + sizes[bucketIndex];
}

class PrintAssetSizesPlugin {
  apply(compiler) {
    compiler.hooks.done.tapAsync('PrintAssetSizesPlugin', (stats, callback) => {
      console.table(stats.toJson().assets.filter(asset => asset.emitted).map(asset => [asset.name, formatBytes(asset.size)]));
      callback();
    });
  }
}

module.exports = PrintAssetSizesPlugin;
