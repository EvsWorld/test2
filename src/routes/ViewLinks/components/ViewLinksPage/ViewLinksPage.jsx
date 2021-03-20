import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useFirestore, useUser, useFirestoreCollectionData } from 'reactfire'
// import ProjectTile from '../ProjectTile'
import styles from './ViewLinksPage.styles'

const useStyles = makeStyles(styles)

/**
 * @param {object} user - individual user object from firebase, with Id added
 * @param collection
 * @returns {Promise} Resolves with sub collectionReference one level down from specified user
 */
// function getCollection(user, collection) {
//   return db.collection('users').doc(user.id).collection(collection)
// }

function useLinksList() {
  // const sharedLinksCollection = await getCollection(user, 'sharedLinks')
  // Get current user (loading handled by Suspense in ProjectsList)
  const { data: auth } = useUser()
  console.log('auth.uid :>> ', auth.uid)
  // Create a ref for links owned by the current user
  const firestore = useFirestore()

  const linksRef = firestore
    .collection('users')
    .doc(auth.uid)
    .collection('sharedLinks')

  console.log('linksRef :>> ', linksRef)

  // Query for links (loading handled by Suspense in ProjectsList)
  const { data: links } = useFirestoreCollectionData(linksRef)
  console.log('links :>> ', links)

  return { links }
}

function ViewLinksPage() {
  const classes = useStyles()

  const { links /* addProject, newDialogOpen, toggleDialog */ } = useLinksList()
  return (
    <div className={classes.root}>
      <span>ViewLinks Component</span>

      <div className={classes.tiles}>
        {/* // TODO: component for the top link. Includes this iframe */}
        <iframe
          sandbox="allow-scripts"
          width="100%"
          id="preview"
          height="600"
          src={links && links[0]?.u}></iframe>
        {links &&
          links.map((link, ind) => {
            return (
              <div key={`Link-${link.uid}-${ind}`}>
                <a href={link.u}>{link.u}</a>
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default ViewLinksPage
