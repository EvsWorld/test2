import PropTypes from 'prop-types'
import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import axios from 'axios'

const Iframe = styled.div`
  max-width: 1000px;
  max-height: 100px;
`

export function DisplayIframe({ topLink }) {
  const [iframeHtml, setIframeHtml] = useState(null)

  // TODO: fetch iframely html
  const apiKey = process.env.REACT_APP_IFRAMELY_API_KEY
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
        setIframeHtml(data.html)
      })
      .catch(function (error) {
        console.log(error)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // TODO: check if resonse is 404, if so then display just the url
  return (
    <Iframe
      dangerouslySetInnerHTML={{
        __html: iframeHtml
      }}
    />
  )
}

DisplayIframe.propTypes = {
  topLink: PropTypes.string.isRequired
}
