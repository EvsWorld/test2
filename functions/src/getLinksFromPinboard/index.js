import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import axios from 'axios'
import moment from 'moment'

const db = admin.firestore()

export const collectIdsAndDocs = (doc) => {
  // turns these into documents that avoid some kind of trouble
  return { id: doc.id, ...doc.data() }
}

/**
 * Handle getLinksFromPinboard pub sub event
 * @param {functions.pubsub.Context} context - Function context
 * @returns {Promise} Returns null
 */
async function getLinksFromPinboardEvent(context) {
  // console.log('Pub Sub message: ', { context })

  loopOverUsers()

  // End function execution by returning
  return null

  /**
   * Loop over all users fetching and saving links
   */
  async function loopOverUsers() {
    const snapshot = await db.collection('users').get()
    const users = snapshot.docs.map(collectIdsAndDocs)
    // console.log('users :>> ', users)
    users.forEach(async (user) => {
      saveLinks(user)

      const shouldMoveLinkFromBacklogToSharedLinks = await wasLinkSharedRecently(
        user
      )
      // If no link shared in the last day, look in that user’s ‘backlog’
      // collection  for the link with the oldest link, copy it to the
      // ‘sharedLinks’ collection and then delete it from backlog
      if (shouldMoveLinkFromBacklogToSharedLinks) {
        console.log('now going to move link from backlog to sharedLinks!')
        // TODO: go take the oldest like from backlog copy it to sharedLinks,
        // then delete from backlog
        const backlogCollectionRef = await getCollection(user, 'backlog')
          .orderBy('timeSavedToDb', 'asc') // sort from older to newer
          .limit(1) // get the top one
        const oldestLinkInBacklog = await backlogCollectionRef.get()

        // console.log(
        //   'oldestLinkInBacklog :>> ',
        //   oldestLinkInBacklog.docs[0].data()
        // )

        const oldestLinkInBacklogWDate = {
          ...collectIdsAndDocs(oldestLinkInBacklog.docs[0]),
          timeSavedToSharedLinks: new Date()
        }
        console.log(`oldestLinkInBacklogWDate for ${user.username} :>> `)
        console.dir(oldestLinkInBacklogWDate, { depth: null })

        // const sharedLinksCollectionRef = await getCollection(
        //   user,
        //   'sharedLinks'
        // )

        // sharedLinksCollectionRef.add(linkToSave)
        // latestLinkFromBacklog.delete()
        // TODO:  send user a message with their url to their custom domain of my site, and
        // change the metadata to that url (done either something on the message or
        // the url itself)
        // function sendMessage( ) { }
      }
    })
  }

  /**
   * checkks if there is no link in user’s ‘sharedLinks’ that was created today.
   * @param user
   * @returns true or false
   */
  async function wasLinkSharedRecently(user) {
    const shareInterval = user.shareInterval // the frequency in days to share to that user
    const sharedLinksCollectionRef = await getCollection(user, 'sharedLinks')
    const sharedLinksSnapshot = await sharedLinksCollectionRef
      .where(
        'timeSavedToDb',
        '>=',
        moment().subtract(shareInterval, 'day').toDate()
      )
      .where('timeSavedToDb', '<', moment().toDate())
      .get()

    if (sharedLinksSnapshot.empty) {
      console.log(
        `No links in ${user.username}'s 'sharedLinks' collection added in the last ${shareInterval} day(s)!`
      )
      // TODO: return false
    } else {
      const foundLinks = sharedLinksSnapshot.docs
      console.log(
        `found ${foundLinks.length} links in ${user.username}'s 'sharedLinks' collection added in the last ${shareInterval} day(s) >> `
      )
      return true
      // foundLinks.forEach((link) => console.log(link.data()))
    }
  }

  /**
   * @param {object} user - individual user object from firebase, with Id added
   * @returns {Promise} - Resolves with links from pinboard for specified user
   */
  async function fetchLinks(user) {
    //  fetch all documents from pinboard
    //  TODO: put this in function getLinksFromPinboard(user)
    const pinboardSecret = functions.config().pinboard.secret
    const pinboardUsername = functions.config().pinboard.username

    const linksResults = await axios.get(
      `http://feeds.pinboard.in/json/secret:${pinboardSecret}/u:${pinboardUsername}/t:${user.username}`
    )
    const links = linksResults.data
    return links
  }

  /**
   * Fetch links and save is user's backlog
   * @param {object} user - individual user object from firebase, with Id added
   */
  async function saveLinks(user) {
    const links = await fetchLinks(user)
    links.forEach(async (linkData) => {
      const linkDataToSave = { ...linkData, timeSavedToDb: new Date() }
      const userBacklog = await getCollection(user, 'backlog')
      upsertLink(userBacklog, linkDataToSave)
    })
  }

  /**
   * Check if a link with that url already exists, if not then add it
   * @param {admin.firstore.CollectionReference} collection - User backlog collection reference
   * @param {object} linkData - link data to insert from pinboard
   */
  async function upsertLink(collection, linkData) {
    const linkSnapshot = await collection.where('u', '==', linkData.u).get()
    if (linkSnapshot.empty) {
      console.log(
        `Attempting to insert link: ${linkData.u} . It didn't exist so I'm going to add it now.`
      )
      collection.add(linkData)
    }
  }

  /**
   * @param {object} user - individual user object from firebase, with Id added
   * @param collection
   * @returns {Promise} Resolves with sub collectionReference one level down from specified user
   */
  function getCollection(user, collection) {
    return db.collection('users').doc(user.id).collection(collection)
  }
}

// const schedule = 'every 1 minutes'
const schedule = '0 22 * * 1-7'

/**
 * Cloud Function triggered on a specified CRON schedule
 *
 * Trigger: `PubSub - onRun`
 *
 * @name getLinksFromPinboard
 * @type {functions.CloudFunction}
 */
export default functions.pubsub
  .schedule(schedule)
  .onRun(getLinksFromPinboardEvent)
