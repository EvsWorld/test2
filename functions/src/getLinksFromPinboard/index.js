import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import axios from 'axios'
import moment from 'moment'

// const db = admin.firestore()

const collectIdsAndDocs = (doc) => {
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
    const snapshot = await admin.firestore().collection('users').get()
    const users = snapshot.docs.map(collectIdsAndDocs)
    // console.log('users :>> ', users)
    users.forEach(async (user) => {
      saveLinks(user)
      moveLink(user)
    })
  }

  /**
   * @param {object} user user
   */
  async function moveLink(user) {
    // TODO: put this in a function
    // If no link shared in the last day, look in that user’s ‘backlog’
    // collection  for the link with the oldest link, copy it to the
    // ‘sharedLinks’ collection and then delete it from backlog
    if (await shouldMoveLinkFromBacklogToSharedLinks(user)) {
      console.log(
        `NO LINKS FOUND in ${user.username}'s 'sharedLinks' collection added in the last ${user.shareInterval} day(s)! I'm going to move one.`
      )
      // go take the oldest like from backlog copy it to sharedLinks,
      const backlogCollectionRef = await getCollection(user, 'backlog')
        // asc: sort from older to newer
        // (however I could use 'desc' while developing so i can add new bookmarks clearly)
        .orderBy('timeSavedToDb', 'asc')
        .limit(1) // get the top one
      const linksToMoveFromBacklog = await backlogCollectionRef.get()
      const linkToMoveFromBacklog = linksToMoveFromBacklog.docs[0]
      // console.log('linkToMoveFromBacklog :>> ', linkToMoveFromBacklog)

      const oldestLinkInBacklogWDate = {
        ...collectIdsAndDocs(linkToMoveFromBacklog),
        timeSavedToSharedLinks: new Date()
      }
      console.log(
        `MOVING a link for ${user.username} :>> `,
        oldestLinkInBacklogWDate
      )

      const sharedLinksCollectionRef = await getCollection(user, 'sharedLinks')

      sharedLinksCollectionRef.add(oldestLinkInBacklogWDate)

      // TODO: then delete from backlog
      const deleted = await linkToMoveFromBacklog.ref.delete()
      console.log('deleted :>> ', deleted)

      // TODO:  send user a message with their url to their custom domain of my site, and
      // change the metadata to that url (done either something on the message or
      // the url itself)
      // function sendMessage( ) { }
    }
  }
  /**
   * checkks if there is no link in user’s ‘sharedLinks’ that was created today.
   * @param {object} user user
   * @returns {boolean} true or false
   */
  async function shouldMoveLinkFromBacklogToSharedLinks(user) {
    const sharedLinksCollectionRef = await getCollection(user, 'sharedLinks')
    const sharedLinksSnapshot = await sharedLinksCollectionRef
      .where(
        'timeSavedToSharedLinks',
        '>=',
        moment().subtract(user.shareInterval, 'min').toDate()
      )
      .where('timeSavedToSharedLinks', '<', moment().toDate())
      .get()

    const noLinksSharedRecently =
      !sharedLinksSnapshot || sharedLinksSnapshot.empty

    if (!sharedLinksSnapshot) {
      console.log('!sharedLinksSnapshot = true')
    }

    if (noLinksSharedRecently) {
      return true
    } else {
      const foundLinks = sharedLinksSnapshot.docs
      console.log(
        `FOUND ${foundLinks.length} LINKS in ${user.username}'s 'sharedLinks' collection added in the last ${user.shareInterval} day(s). I'm not moving anything.`
      )
      return false
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
      upsertLink(user, linkDataToSave)
    })
  }

  /**
   * Check if a link with that url already exists, if not then add it
   * @param {object} user - individual user object from firebase, with Id added
   * @param {object} linkData - link data to insert from pinboard
   */
  async function upsertLink(user, linkData) {
    const backlogCollection = await getCollection(user, 'backlog')
    const sharedLinksCollection = await getCollection(user, 'sharedLinks')
    const queryOfSharedLinksForNewLink = await backlogCollection
      .where('u', '==', linkData.u)
      .get()
    const queryOfBacklogForNewLink = await sharedLinksCollection
      .where('u', '==', linkData.u)
      .get()
    if (queryOfBacklogForNewLink.empty && queryOfSharedLinksForNewLink.empty) {
      console.log(
        `For user ${user.username}: Attempting to insert link: ${linkData.u} . It didn't exist so I'm going to add it now.`
      )
      backlogCollection.add(linkData)
    }
  }

  /**
   * @param {object} user - individual user object from firebase, with Id added
   * @param {any} collection collection you want
   * @returns {Promise} Resolves with sub collectionReference one level down from specified user
   */
  function getCollection(user, collection) {
    return admin
      .firestore()
      .collection('users')
      .doc(user.id)
      .collection(collection)
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
