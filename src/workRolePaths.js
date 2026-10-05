export function getWorkRolePath(title) {
  const slug = title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `/find-work/${slug}`;
}
