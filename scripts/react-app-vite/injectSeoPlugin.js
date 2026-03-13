export class Tag {
  constructor(tagName, attributes) {
    this.tagName = tagName;
    this.attributes = attributes;
  }
}

export class MetaTag extends Tag {
  constructor(name, content) {
    super('meta', {
      name,
      content,
    });
  }
}

export const injectSeoPlugin = ({
  title,
  tags,
}) => {
  return {
    name: 'inject-seo',
    transformIndexHtml(html) {
      return {
        html: html.replace(/<title>(.*?)<\/title>/, `<title>${title}</title>`),
        tags: tags.map((tag) => ({
          tag: tag.tagName,
          attrs: tag.attributes,
        })),
      };
    },
  };
};
