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
