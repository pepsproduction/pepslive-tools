export const YOUTUBE_CHANNEL_HANDLE = '@pepsproduction';

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_THUMBNAIL_HOSTS = new Set(['i.ytimg.com', 'img.youtube.com']);

const safeThumbnail = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && YOUTUBE_THUMBNAIL_HOSTS.has(url.hostname) ? url.href : '';
  } catch {
    return '';
  }
};

export const toPublicUpcomingStreams = (response) => {
  const videos = Array.isArray(response?.items) ? response.items : [];
  return videos.flatMap((video) => {
    const id = video?.id;
    const title = typeof video?.snippet?.title === 'string' ? video.snippet.title.trim() : '';
    if (!YOUTUBE_ID.test(id || '') || !title || !video.liveStreamingDetails?.scheduledStartTime) return [];

    const thumbnails = video.snippet.thumbnails || {};
    const thumbnail = [thumbnails.maxres, thumbnails.high, thumbnails.medium, thumbnails.default]
      .map((item) => safeThumbnail(item?.url))
      .find(Boolean) || '';

    return [{
      videoId: id,
      title,
      startsAt: video.liveStreamingDetails.scheduledStartTime,
      thumbnail,
      url: `https://www.youtube.com/watch?v=${id}`
    }];
  }).sort((left, right) => left.startsAt.localeCompare(right.startsAt));
};
