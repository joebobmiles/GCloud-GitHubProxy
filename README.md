# GCloud GitHub API Proxy

This is a GCloud Function for solving an embarrassingly simple problem: allowing
an app that has authenticated with GitHub via Auth0 to make API calls to GitHub
without exposing the GitHub API access token to the app.

> ***NOTE***: This is intended to be an incredibly temporary solution, since the
> function has to request the access token from Auth0 _every request_. This
> means the app must wait for 3 API requests to resolve before it sees any data.
>
> To reduce the amount of requests, the access token could be cached by the
> proxy. Since this is a GCloud Function, any cache we create will not be
> persisted, so this code would have to be integrated into it's own stand
> alone server with a Redis instance or something to persist the data between
> requests.

## How it works

 1. The GCloud Function (further called the _proxy_), receives a GraphQL
    query and an Auth0 access token via a POST request.
 2. The proxy uses the Auth0 access token to request the corresponding GitHub
    access token via the Auth0 Management API.
     a. If the Auth0 request fails, the proxy echoes that failure back to the
        requesting app.
 3. Once the GitHub access token has been retrieved, the proxy forwards the
    GraphQL query to the GitHub API, authenticating with the GitHub access
    token.
 4. The response recieved from GitHub is then forwarded back to the original
    requestor.