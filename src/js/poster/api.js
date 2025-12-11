const makeApiRequest = async (path, method, data) =>
  new Promise((resolve, reject) => {
    Poster.makeApiRequest(
      path,
      {
        method,
        data,
      },
      (response) => {
        if (response.error) {
          reject(response.error)
        }
        resolve(response.result)
      }
    )
  })

const setEntityExtras = (extras) =>
  makeApiRequest('application.setEntityExtras', 'post', {
    entity_type: 'tablet',
    entity_id: window.Poster.settings.spotTabletId,
    extras,
  })

export { setEntityExtras }
