// Match complete attributes so renaming repo does not alter repo-vscode.
export function updateRepoReferences(readme, oldRepo, newRepo) {
  let result = readme
    .replaceAll(`href="https://github.com/${oldRepo}"`, `href="https://github.com/${newRepo}"`)
    .replaceAll(`alt="${oldRepo}"`, `alt="${newRepo}"`);
  for (const theme of ['light', 'dark']) {
    result = result.replaceAll(
      `"assets/cards/${oldRepo.replace('/', '--')}-${theme}.svg"`,
      `"assets/cards/${newRepo.replace('/', '--')}-${theme}.svg"`
    );
  }
  return result;
}
