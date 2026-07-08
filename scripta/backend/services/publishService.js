// Handles "publishing" a post to a given platform.
//
// IMPORTANT: Real publishing requires a registered developer app with each
// platform, an approved OAuth flow, and (for most platforms) an app review
// process before you can post on behalf of users. None of that can be faked -
// you have to do it with each platform directly:
//   X (Twitter):  https://developer.twitter.com/
//   LinkedIn:     https://www.linkedin.com/developers/
//   Meta (IG/FB): https://developers.facebook.com/
//   TikTok:       https://developers.tiktok.com/
//
// Until you plug in real credentials, every platform below just simulates
// success after a short delay so the rest of the app (scheduling, status
// tracking, UI) works end-to-end. Swap the body of each function for a real
// API call once you have credentials - the shape of the return value
// ({ success, externalId, message }) is what the rest of the app expects.

async function publishToInstagram(post, account) {
  // TODO: Real implementation uses the Meta Graph API:
  //   1. POST /{ig-user-id}/media with image_url/caption to create a container
  //   2. POST /{ig-user-id}/media_publish with the container id
  // Docs: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
  return simulate('instagram', post, account);
}

async function publishToTikTok(post, account) {
  // TODO: Real implementation uses the TikTok Content Posting API.
  // Docs: https://developers.tiktok.com/doc/content-posting-api-get-started
  return simulate('tiktok', post, account);
}

async function publishToX(post, account) {
  // TODO: Real implementation uses X API v2 POST /2/tweets with OAuth 1.0a
  // or OAuth 2.0 user context.
  // Docs: https://developer.x.com/en/docs/x-api/tweets/manage-tweets/api-reference/post-tweets
  return simulate('x', post, account);
}

async function publishToLinkedIn(post, account) {
  // TODO: Real implementation uses the LinkedIn Posts API (UGC/Posts).
  // Docs: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
  return simulate('linkedin', post, account);
}

async function publishToFacebook(post, account) {
  // TODO: Real implementation uses POST /{page-id}/feed on the Graph API.
  // Docs: https://developers.facebook.com/docs/pages-api/posts
  return simulate('facebook', post, account);
}

async function publishToYoutube(post, account) {
  // TODO: Real implementation uses the YouTube Data API v3 videos.insert,
  // for Shorts this means uploading a vertical video file plus this caption.
  // Docs: https://developers.google.com/youtube/v3/guides/uploading_a_video
  return simulate('youtube', post, account);
}

async function simulate(platform, post, account) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    success: true,
    externalId: `simulated-${platform}-${Date.now()}`,
    message: `Simulated publish to ${platform} as @${account.handle}. Connect real API credentials in .env to go live.`,
  };
}

const PUBLISHERS = {
  instagram: publishToInstagram,
  tiktok: publishToTikTok,
  x: publishToX,
  linkedin: publishToLinkedIn,
  facebook: publishToFacebook,
  youtube: publishToYoutube,
};

async function publish(post, account) {
  const fn = PUBLISHERS[post.platform];
  if (!fn) {
    return { success: false, message: `Unsupported platform: ${post.platform}` };
  }
  try {
    return await fn(post, account);
  } catch (err) {
    return { success: false, message: err.message };
  }
}

module.exports = { publish };
