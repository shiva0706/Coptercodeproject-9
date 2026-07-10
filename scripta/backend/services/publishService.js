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

async function publishToDiscord(post, account) {
  // TODO: Real implementation posts via a Discord webhook (simplest) or a
  // bot using the Discord API's channel message endpoint.
  // Docs: https://discord.com/developers/docs/resources/webhook
  return simulate('discord', post, account);
}

async function publishToReddit(post, account) {
  // TODO: Real implementation uses the Reddit API's /api/submit endpoint,
  // requires a registered app and OAuth2.
  // Docs: https://www.reddit.com/dev/api/#POST_api_submit
  return simulate('reddit', post, account);
}

async function publishToPinterest(post, account) {
  // TODO: Real implementation uses the Pinterest API's POST /pins endpoint.
  // Docs: https://developers.pinterest.com/docs/api/v5/#operation/pins/create
  return simulate('pinterest', post, account);
}

async function publishToBluesky(post, account) {
  // TODO: Real implementation uses the AT Protocol's com.atproto.repo.createRecord
  // (app.bsky.feed.post collection) via an app password or OAuth session.
  // Docs: https://docs.bsky.app/docs/tutorials/creating-a-post
  return simulate('bluesky', post, account);
}

async function publishToTumblr(post, account) {
  // TODO: Real implementation uses the Tumblr API's POST /v2/blog/{id}/posts.
  // Docs: https://www.tumblr.com/docs/en/api/v2#postspost-type-legacy---create-a-new-blog-post-legacy
  return simulate('tumblr', post, account);
}

async function publishToThreads(post, account) {
  // TODO: Real implementation uses the Threads API (Meta), a two-step
  // create-container-then-publish flow similar to Instagram's.
  // Docs: https://developers.facebook.com/docs/threads
  return simulate('threads', post, account);
}

async function publishToSnapchat(post, account) {
  // TODO: Real implementation uses the Snapchat Marketing/Creative Kit API -
  // organic posting access is limited and requires platform approval.
  // Docs: https://developers.snap.com/
  return simulate('snapchat', post, account);
}

// account is optional now - Contacts was removed as a standalone page, and
// setting a handle in Compose is just a nice-to-have, not a requirement to
// publish. Only mention "as @handle" when one was actually set.
async function simulate(platform, post, account) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const asHandle = account && account.handle ? ` as @${account.handle}` : '';
  return {
    success: true,
    externalId: `simulated-${platform}-${Date.now()}`,
    message: `Simulated publish to ${platform}${asHandle}. Connect real API credentials in .env to go live.`,
  };
}

const PUBLISHERS = {
  instagram: publishToInstagram,
  tiktok: publishToTikTok,
  x: publishToX,
  linkedin: publishToLinkedIn,
  facebook: publishToFacebook,
  youtube: publishToYoutube,
  discord: publishToDiscord,
  reddit: publishToReddit,
  pinterest: publishToPinterest,
  bluesky: publishToBluesky,
  tumblr: publishToTumblr,
  threads: publishToThreads,
  snapchat: publishToSnapchat,
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