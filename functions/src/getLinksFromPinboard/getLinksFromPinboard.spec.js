import getLinksFromPinboardUnwrapped from './index'

import functionsTestLib from 'firebase-functions-test'

const functionsTest = functionsTestLib()
const getLinksFromPinboard = functionsTest.wrap(getLinksFromPinboardUnwrapped)

describe('getLinksFromPinboard PubSub Cloud Function (PubSub:onRun)', () => {
  // after(async () => {
  //   functionsTest.cleanup()
  // })

  it.only('should handle event', async () => {
    const results = await getLinksFromPinboard({})
    expect(results).to.be.null
  })
})
