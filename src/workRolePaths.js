export function getWorkRolePath(title) {
  const slug = title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `/find-work/${slug}`;
}

export function getSelectedWorkRole(query, industry, roleTitles) {
  const selected = roleTitles.find(title => title.toLowerCase() === industry.trim().toLowerCase());
  if (selected) return selected;
  const keyword = query.trim().toLowerCase();
  if (['construction labourer', 'general labourer', 'labourer'].includes(keyword)) return roleTitles[0];
  return roleTitles.find(title => title.toLowerCase() === keyword) || null;
}

export function getWorkRoleSearchPath(title, location = '') {
  const params = new URLSearchParams();
  if (location.trim()) params.set('location', location.trim());
  return `${getWorkRolePath(title)}${params.size ? `?${params}` : ''}`;
}
