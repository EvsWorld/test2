import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useFirestore, useUser, useFirestoreCollectionData } from 'reactfire'
// import ProjectTile from '../ProjectTile'
import styles from './ViewLinksPage.styles'
import { DisplayIframe } from './DisplayIframe'
import { USERS_COLLECTION } from 'constants/firebasePaths'
const useStyles = makeStyles(styles)

function useLinksList() {
  // const sharedLinksCollection = await getCollection(user, 'sharedLinks')
  // Get current user (loading handled by Suspense in ProjectsList)
  const { data: auth } = useUser()
  console.log('auth.uid :>> ', auth.uid)
  // Create a ref for links owned by the current user
  const firestore = useFirestore()

  const linksRef = firestore
    .collection(USERS_COLLECTION)
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
  const { links } = useLinksList()
  const topLinka = links.shift().u
  const restOfLinks = links

  return (
    <div className={classes.root}>
      <span>ViewLinks Component</span>

      <div className={classes.tiles}>
        <DisplayIframe topLink={topLinka} />
        {restOfLinks &&
          restOfLinks.map((link, ind) => {
            return (
              <div key={`Link-${link.uid}-${ind}`}>
                <DisplayIframe topLink={link.u} />
                <br />
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default ViewLinksPage
