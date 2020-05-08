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