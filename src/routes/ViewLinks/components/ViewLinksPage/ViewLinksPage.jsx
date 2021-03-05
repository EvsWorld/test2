import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import styles from './ViewLinksPage.styles'

const useStyles = makeStyles(styles)

function ViewLinksPage() {
  const classes = useStyles()
  // const {} = useViewLinks()

  return (
    <div className={classes.root}>
      <span>ViewLinks Component</span>
    </div>
  )
}

export default ViewLinksPage
