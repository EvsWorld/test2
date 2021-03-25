import React from 'react'
import { useFirestore, useUser, useFirestoreCollectionData } from 'reactfire'
import styled from 'styled-components'
import { DisplayIframe } from './DisplayIframe'
import { USERS_COLLECTION } from 'constants/firebasePaths'

const LinksContainer = styled.div`
  display: flex;
  ${'' /* align-items: center; */}
  flex-direction: column;
  ${'' /* min-width: 500px; */}
`

function useLinksList() {
  // TODO: put all this in useEffect
  // Get current user (loading handled by Suspense in ProjectsList)
  const { data: auth } = useUser()
  console.log('auth.uid :>> ', auth.uid)
  // Create a ref for links owned by the current user
  const firestore = useFirestore()

  const linksRef = firestore
    .collection(USERS_COLLECTION)
    .doc(auth.uid)
    .collection('sharedLinks')
    .orderBy('timeSavedToSharedLinks', 'desc')

  console.log('linksRef :>> ', linksRef)

  // Query for links (loading handled by Suspense in ProjectsList)
  const { data: links } = useFirestoreCollectionData(linksRef)
  console.log('links :>> ', links)

  const topLink = links[0]
  const restOfLinks = links.slice(1, links.length)
  return { topLink, restOfLinks }
}

function ViewLinksPage() {
  // TODO: put this in state, set in useeffect
  const { topLink, restOfLinks } = useLinksList()

  return (
    <div>
      <span>ViewLinks Component</span>

      <LinksContainer>
        <DisplayIframe topLink={topLink.u} />
        {restOfLinks && restOfLinks.length > 0
          ? restOfLinks.map((link, ind) => {
              return (
                <div key={`Link-${link.uid}-${ind}`}>
                  <DisplayIframe topLink={link.u} />
                  <br />
                </div>
              )
            })
          : null}
      </LinksContainer>
    </div>
  )
}

export default ViewLinksPage
