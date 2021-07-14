const HtmlWebpackPlugin = require('html-webpack-plugin');

class Tag {
  constructor(tagName, attributes) {
    this.tagName = tagName;
    this.attributes = attributes;
  }
}

class MetaTag extends Tag {
  constructor(name, content) {
    super('meta', {
      'name': name,
      'content': content,
    })
  }
}

class InjectSeoPlugin {
  constructor(title, tags) {
    this.title = title;
    this.tags = tags;
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('InjectSeoPlugin', compilation => {
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync('InjectSeoPlugin.beforeEmit', (htmlPluginData, callback) => {
        htmlPluginData.html = htmlPluginData.html.replace(/<title>.*<\/title>/i, `<title>${this.title}</title>`);
        callback(null, htmlPluginData);
      });
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync('InjectSeoPlugin.alterAssetTagGroups', (htmlPluginData, callback) => {
        this.tags.forEach((tag) => {
          htmlPluginData.headTags.push(tag);
        });
        callback(null, htmlPluginData);
      });
    });
  }
}

const myModule = module.exports = InjectSeoPlugin;
myModule.Tag = Tag;
myModule.MetaTag = MetaTag;
