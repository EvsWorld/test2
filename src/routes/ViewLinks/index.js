import { loadable } from 'utils/router'
import { VIEW_LINKS_PATH as path } from 'constants/paths'

export default {
  path,
  authRequired: true,
  component: loadable(() =>
    import(/* webpackChunkName: 'viewLinks' */ './components/ViewLinksPage')
  )
}
