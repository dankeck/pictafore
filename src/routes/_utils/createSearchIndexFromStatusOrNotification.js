let domParser

// copy-pasta'd from
// https://github.com/mastodon/mastodon/blob/b7902225d698a107df2cf8b4ca221caad38fa464/app/javascript/mastodon/actions/importer/normalizer.js#L65
export const createSearchIndexFromStatusOrNotification = statusOrNotification => {
  const status = statusOrNotification.status || statusOrNotification // status on a notification
  const originalStatus = status.reblog || status
  domParser = domParser || new DOMParser()
  const spoilerText = originalStatus.spoiler_text || ''
  const searchContent = [spoilerText, originalStatus.content]
    .concat((originalStatus.poll && originalStatus.poll.options) ? originalStatus.poll.options.map(option => option.title) : [])
    .concat((originalStatus.media_attachments && originalStatus.media_attachments.length) ? originalStatus.media_attachments.map(att => att.description) : [])
    .join('\n\n').replace(/<br\s*\/?>/g, '\n').replace(/<\/p><p>/g, '\n\n')
  return domParser.parseFromString(searchContent, 'text/html').documentElement.textContent
}
