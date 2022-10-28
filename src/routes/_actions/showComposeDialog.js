import { store } from '../_store/store.js'
import { importShowComposeDialog } from '../_components/dialog/asyncDialogs/importShowComposeDialog.js'
import { database } from '../_database/database.js'
import { doMediaUpload } from './media.js'

// show a compose dialog, typically invoked by the Web Share API or a PWA shortcut
export async function showComposeDialog () {
  const { isUserLoggedIn } = store.get()
  if (!isUserLoggedIn) {
    return
  }
  const importShowComposeDialogPromise = importShowComposeDialog() // start promise early

  const data = await database.getWebShareData()

  if (data) {
    await database.deleteWebShareData() // only need this data once; it came from Web Share (service worker)
  }

  console.log('share data', data)
  const { title, text, url, file } = (data || {})

  // url is currently ignored on Android, but one can dream
  // https://web.dev/web-share-target/#verifying-shared-content
  const composeText = [title, text, url].filter(Boolean).join('\n\n')
  const [showComposeDialog, twitterPost] = await Promise.all([importShowComposeDialogPromise, Promise.resolve(new URLSearchParams(location.search).get('retweet')).then(rt=>rt&&fetch(Object.assign(new URL(rt, {hostname: "birdlink.easrng.workers.dev"})).href)).then(e=>e.text()).catch(e=>console.warn("failed to load tweet", e))])

  store.clearComposeData('dialog')
  store.setComposeData('dialog', { text: composeText || twitterPost })
  store.save()

  showComposeDialog()
  if (file) { // start the upload once the dialog is in view so it shows the loading spinner and everything
    /* no await */ doMediaUpload('dialog', file)
  }
}
