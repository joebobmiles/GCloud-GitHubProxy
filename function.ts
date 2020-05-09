import { Request, Response } from "express"
import { ManagementClient } from "auth0"
import { graphql } from "@octokit/graphql"


export const ghProxy = async (request: Request, response: Response) => {
  response.set("Access-Control-Allow-Origin", "*")

  if (request.method === "OPTIONS") {
    response.set("Access-Control-Allow-Methods", "POST")
    response.set("Access-Control-Allow-Headers", "Content-Type")
    response.set("Access-Control-Max-Age", "3600")
    response.status(204).send("")

    return
  }


  const requestBody = JSON.parse(request.body)


  /*
  Request the Auth0 Management API access_token
  */

  const auth0 = new ManagementClient({
    domain: process.env.AUTH0_URL,
    clientId: process.env.AUTH0_ID,
    clientSecret: process.env.AUTH0_SECRET
  })

  let user

  try {
    user = await auth0.getUser({ id: requestBody.user_id })
                      .catch((reason) => { throw reason })
  }
  catch (reason) {
    response.status(reason.statusCode).json({
      reason: reason.message
    })
    return
  }

  /*
  Use the access_token stored in the retrieved identity to make the GH API
  request.
  */

  const access_token = user.identities[0].access_token
  const { query, variables } = requestBody

  let queryResult

  try {
    queryResult = await graphql(
      query,
      {
        ...variables,
        headers: {
          authorization: `bearer ${access_token}`
        }
      }
    )
  }
  catch (error) {
    response.status(400).json({
      ...error
    })
  }

  response.status(200).json(queryResult)
}