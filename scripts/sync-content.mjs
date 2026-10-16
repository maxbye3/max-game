// Keep independent feeds updating even when one provider is unavailable.
const results = await Promise.allSettled([
  import('./sync-goodreads-read.mjs'),
  import('./sync-letterboxd-reviews.mjs'),
  import('./sync-google-photos.mjs').then(({ syncGooglePhotos }) => syncGooglePhotos()),
]);
for (const result of results) {
  if (result.status !== 'rejected') continue;
  console.error(result.reason);
  process.exitCode = 1;
}
