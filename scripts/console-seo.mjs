const replaceOnce = (text, from, to) => {
  if (!text.includes(from)) throw new Error(`index.html no longer contains: ${from}`);
  return text.replace(from, to);
};

export function addConsoleSeoMetadata(html) {
  const tags = [
    '<link rel="canonical" href="https://flisk.sh/console/" />',
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Flisk CLI" />',
    '<meta property="og:title" content="FliskOS | Flisk CLI" />',
    '<meta property="og:description" content="FliskOS: Flisk projects, coding agents and Flisk apps in one local window" />',
    '<meta property="og:url" content="https://flisk.sh/console/" />',
    '<meta property="og:image" content="https://flisk.sh/assets/images/flisk-social-card.png?v=2" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    '<meta name="twitter:title" content="FliskOS | Flisk CLI" />',
    '<meta name="twitter:description" content="FliskOS: Flisk projects, coding agents and Flisk apps in one local window" />',
    '<meta name="twitter:image" content="https://flisk.sh/assets/images/flisk-social-card.png?v=2" />',
  ].join('\n    ');
  return replaceOnce(
    html,
    '<meta name="robots" content="noindex" />',
    `<meta name="robots" content="noindex" />\n    ${tags}`,
  );
}
