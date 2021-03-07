import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import axios from 'axios'
const db = admin.firestore()

const pinboardSecret = ''
const pinboardUsername = 'EHendrix'
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
/**
 * Handle getLinksFromPinboard pub sub event
 * @param {functions.pubsub.Context} context - Function context
 * @returns {Promise}
 */
async function getLinksFromPinboardEvent(context) {
  // console.log('Pub Sub message: ', { context })

  //  fetch all documents from pinboard
  const pinboardSecret = functions.config().pinboard.secret
  const pinboardUsername = functions.config().pinboard.username
  const linksResults = await axios.get(
    `http://feeds.pinboard.in/json/secret:${pinboardSecret}/u:${pinboardUsername}/t:tom`
  )
  const links = linksResults.data
  // console.log('links:>> ', links)

  // TODO: get ref to where we want to save them (/users/{userId})

  // TODO: function to loop over all the users in db,
  links.forEach(async (linkData) => {
    const linkCollectionRef = admin.firestore().collection('links')
    const linkSnapshot = await linkCollectionRef
      .where('u', '==', linkData.u)
      .get()
    if (linkSnapshot.empty) {
      console.log('No mathing documents')
      // linkSnapshot.set({ linkData })
      linkCollectionRef.add(linkData)
    }
  })

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
