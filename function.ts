import * as https from "https"
import { Request, Response } from "express"

const makeRequest = (
  options: https.RequestOptions,
  payload?: any
) => {
  let recieved: string

  const request = https.request(
    options,
    (response) => response.on("data", (data) => {
      recieved = data
    })
  )

  request.on("error", (error) => {
    console.error(error)
  })

  if (options.method === "POST")
    request.write(payload)

  request.end()

  return recieved
}

export const ghProxy = (request: Request, response: Response) => {
  /*
  Request the Auth0 Management API access_token
  */
  const auth0Response = JSON.parse(makeRequest(
    {
      hostname: process.env.AUTH0_URL,
      path: "/oauth/token",
      method: "POST",
    },
    JSON.stringify({
      client_id: process.env.AUTH0_ID,
      client_secret: process.env.AUTH0_SECRET,
      audience: `${process.env.AUTH0_URL}/api/v2`,
      grant_type: "client_credentials"
    })
  ))

  if (auth0Response.access_token === undefined) {
    // TODO: RESPOND WITH AUTH0 ERROR
    console.error(auth0Response)
  }

  /*
  Request the GitHub identity that Auth0 has for the user_id
  */
  const ghTokenResponse = JSON.parse(makeRequest(
    {
      hostname: process.env.AUTH0_URL,
      path: `/api/v2/users/${request.params.user_id}`,
      method: "GET",
      headers: {
        Authorization: `${auth0Response.token_type} ${auth0Response.access_token}`
      }
    }
  ))

  if (ghTokenResponse.identities === undefined) {
    // TODO: RESPOND WITH AUTH0 ERROR
    console.error(ghTokenResponse)
  }


  const { query, variables } = request.params


  /*
  Use the access_token stored in the retrieved identity to make the GH API
  request.
  */
  const gitHubResponse = JSON.parse(makeRequest(
    {
      hostname: "api.github.com",
      path: "/graphql",
      method: "POST",
      headers: {
        Authorization: `Bearer ${ghTokenResponse.identities[0].access_token}`
      }
    },
    JSON.stringify({
      query,
      variables
    })
  ))



  response.send(gitHubResponse)
}