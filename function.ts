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


  response.set("Access-Control-Allow-Origin", "*")


  if (request.method === "OPTIONS") {
    response.set("Access-Control-Allow-Methods", "POST")
    response.set("Access-Control-Allow-Headers", "Content-Type")
    response.set("Access-Control-Max-Age", "3600")
    response.status(204).send("")

    return
  }


  /*
  Request the Auth0 Management API access_token
  */
  const auth0Response = makeRequest(
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
  )

  let auth0Token

  try {
    auth0Token = JSON.parse(auth0Response)
  }
  catch (error) {
    console.error(error)
    response.status(500).send()
    return
  }

  if (auth0Token.access_token === undefined) {
    console.error(auth0Token)
    response.status(400)
    return
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
        Authorization: `${auth0Token.token_type} ${auth0Token.access_token}`
      }
    }
  ))

  if (ghTokenResponse.identities === undefined) {
    // TODO: RESPOND WITH AUTH0 ERROR
    console.error(ghTokenResponse)
    response.status(400).send(ghTokenResponse)
    return
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