const { Table } = require('console-table-printer');

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) {
    return '0 B';
  }
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const bucketIndex = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = parseFloat((bytes / (1024 ** bucketIndex)).toFixed(decimals < 0 ? 0 : decimals));
  return `${size} ${sizes[bucketIndex]}`;
}

class PrintAssetSizesPlugin {
  // eslint-disable-next-line class-methods-use-this
  apply(compiler) {
    compiler.hooks.done.tap('PrintAssetSizesPlugin', (stats) => {
      const statsJson = stats.toJson({ moduleTrace: false }, true);
      if (statsJson.errors.length > 0) {
        return;
      }
      const emittedAssets = stats.toJson().assets.filter((asset) => asset.emitted);
      const sortedAssets = emittedAssets.sort((asset1, asset2) => asset1.size < asset2.size);
      const table = new Table({
        columns: [
          { name: 'name', alignment: 'left', maxLen: 50 },
          { name: 'size', alignment: 'left' },
        ],
      });
      sortedAssets.forEach((asset) => {
        table.addRow({ name: asset.name, size: formatBytes(asset.size) }, { color: asset.size > 100 * 1024 ? 'yellow' : 'white' });
      });
      table.printTable();
    });
  }
}

module.exports = PrintAssetSizesPlugin;
