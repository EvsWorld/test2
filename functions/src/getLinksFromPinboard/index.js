import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import axios from 'axios'

// eslint-disable-next-line no-unused-vars
const dummyLinks = [
  {
    u: 'https://react-hook-form.com/',
    d: 'Home | React Hook Form - Simple React forms validation',
    n: '',
    dt: '2021-03-04T09:49:02Z',
    a: 'EHendrix',
    t: ['tom', 'mike']
  },
  {
    u: 'https://www.thepullrequest.com/p/the-american-dream-as-a-service',
    d: 'The American-Dream-as-a-Service - The Pull Request',
    n: null,
    dt: '2021-03-04T01:31:08Z',
    a: 'EHendrix',
    t: ['dan', 'mike', 'puzzle-pieces', 'tom']
  },
  {
    u: 'https://a16z.com/2021/02/27/nfts-and-a-thousand-true-fans/',
    d: 'a16z.com',
    n: '',
    dt: '2021-03-04T00:52:02Z',
    a: 'EHendrix',
    t: ['mike', 'tom']
  }
]

export const collectIdsAndDocs = (doc) => {
  // turns these into documents that avoid some kind of trouble
  return { id: doc.id, ...doc.data() }
}

/**
 * Handle getLinksFromPinboard pub sub event
 * @param {functions.pubsub.Context} context - Function context
 * @returns {Promise}
 */
async function getLinksFromPinboardEvent(context) {
  // console.log('Pub Sub message: ', { context })

  // TODO: loop over all users
  /**
   *
   */
  async function loopOverUsers() {
    const snapshot = await admin.firestore().collection('users').get()
    const users = snapshot.docs.map(collectIdsAndDocs)
    // console.log('users :>> ', users)
    users.forEach(saveLinks)
  }
  /**
   * @param user
   */
  loopOverUsers()

  /**
   * @param userRef
   * @param user
   */
  async function fetchLinks(user) {
    //  fetch all documents from pinboard
    //  TODO: put this in function getLinksFromPinboard(user)
    const pinboardSecret = functions.config().pinboard.secret
    const pinboardUsername = functions.config().pinboard.username
    console.log(
      'axios url :>> ',
      `http://feeds.pinboard.in/json/secret:${pinboardSecret}/u:${pinboardUsername}/t:${user.username}`
    )
    const linksResults = await axios.get(
      // `http://feeds.pinboard.in/json/secret:${pinboardSecret}/u:${pinboardUsername}/t:tom`
      `http://feeds.pinboard.in/json/secret:${pinboardSecret}/u:${pinboardUsername}/t:${user.username}`
    )
    const links = linksResults.data
    return links
  }

  //  TODO: put this in function saveLinksToUser(user)
  //  saveLinksToUser(user) {
  // const userlinks = getLinksFromPinboard(user)
  // }
  /**
   * @param user
   */
  async function saveLinks(user) {
    const links = await fetchLinks(user)
    links.forEach(async (linkData) => {
      console.log({ id: user.id, username: user.username })
      const userBacklog = admin
        .firestore()
        .collection('users')
        .doc(user.id)
        .collection('backlog')

      const linkSnapshot = await userBacklog.where('u', '==', linkData.u).get()
      if (linkSnapshot.empty) {
        console.log('No matching documents')
        try {
          userBacklog.add(linkData)
        } catch (error) {
          console.error('error adding link to user backlog')
        }
      }
    })
  }
  // TODO: function sendMessage( ) {
  // send user a message with their url to their custom domain of my site, and
  // change the metadata to that url (done either something on the message or
  // the url itself)

  // }

  // End function execution by returning
  return null
}

// call pinboard to get all their new links,

// and then save those links in that user's 'backlog' array field

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
