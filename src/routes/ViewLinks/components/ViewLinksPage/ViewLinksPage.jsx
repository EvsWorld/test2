import PropTypes from 'prop-types'
import React, { useState, useEffect } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useFirestore, useUser, useFirestoreCollectionData } from 'reactfire'
import axios from 'axios'
// import ProjectTile from '../ProjectTile'
import styles from './ViewLinksPage.styles'
const useStyles = makeStyles(styles)

export function DisplayIframe({ topLink }) {
  const [iframeHtml, setIframeHtml] = useState(null)
  // TODO: fetch iframely html

  console.log('topLink :>> ', topLink)

  const apiKey = process.env.REACT_APP_API_KEY
  useEffect(() => {
    const config = {
      method: 'get',
      url: `https://iframe.ly/api/oembed?url=${topLink}&api_key=${apiKey}&iframe=1&omit_script=1`,
      headers: {
        authority: 'iframe.ly',
        'sec-ch-ua':
          '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        dnt: '1',
        'upgrade-insecure-requests': '1',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'sec-fetch-site': 'cross-site',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-user': '?1',
        'sec-fetch-dest': 'document',
        referer: 'https://iframely.com/',
        'accept-language':
          'en-US,en;q=0.9,es;q=0.8,es-419;q=0.7,ca;q=0.6,it;q=0.5'
      }
    }

    axios(config)
      .then(function (response) {
        const data = response.data
        console.log(JSON.stringify(data.html))
        setIframeHtml(data.html)
      })
      .catch(function (error) {
        console.log(error)
      })
  }, [])
  // return dangerously set html
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: iframeHtml
      }}
    />
  )
}

DisplayIframe.propTypes = {
  topLink: PropTypes.string.isRequired
}

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

  const { links } = useLinksList()
  const topLink = links && links[0]?.u
  console.log('topLink :>> ', typeof topLink)

  return (
    <div className={classes.root}>
      <span>ViewLinks Component</span>

      <div className={classes.tiles}>
        <DisplayIframe topLink={topLink} />
        {links &&
          links.map((link, ind) => {
            return (
              <div key={`Link-${link.uid}-${ind}`}>
                <a rel="noopener noreferrer" target="_blank" href={link.u}>
                  {link.u}
                </a>
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default ViewLinksPage
