function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) {
    return '0B';
  }
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const bucketIndex = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / (1024 ** bucketIndex)).toFixed(decimals < 0 ? 0 : decimals))} ${sizes[bucketIndex]}`;
}

class PrintAssetSizesPlugin {
  // eslint-disable-next-line class-methods-use-this
  apply(compiler) {
    compiler.hooks.done.tapAsync('PrintAssetSizesPlugin', (stats, callback) => {
      const emittedAssets = stats.toJson().assets.filter((asset) => asset.emitted);
      console.table(emittedAssets.map((asset) => {
        // NOTE(krishan711): console.table does something wierd with colors (its all printing green) and cant use chalk: https://github.com/chalk/chalk/issues/311
        return [asset.name, formatBytes(asset.size)];
      }));
      callback();
    });
  }
}

module.exports = PrintAssetSizesPlugin;
