import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import axios from 'axios'

const db = admin.firestore()
db.settings({ timestampsInSnapshots: true })

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
      // TODO: 'newLink' function that runs and checks if there is no link in user’s
      // ‘sharedLinks’ that was created today. If not, then it will look in that
      // user’s ‘backlog’ collection  for the link with the oldest link, copy it to
      // the ‘sharedLinks’ collection and then delete it from backlog, then  and
      // sends message

      // const sharedLinksCollectionRef = await getCollection(user, 'sharedLinks')
      // const sharedLinksSnapshot = await sharedLinksCollectionRef
      //   .where('dateCreated', '==', 'todays date')
      //   .get()

      // if (sharedLinksSnapshot.empty) {
      //   console.log('No matching documents')
      // }

      // TODO:  send user a message with their url to their custom domain of my site, and
      // change the metadata to that url (done either something on the message or
      // the url itself)
      // function sendMessage( ) { }
    })
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
      // console.log({ id: user.id, username: user.username })
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
      console.log('No matching documents')
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
const schedule = '* * * * *'

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
