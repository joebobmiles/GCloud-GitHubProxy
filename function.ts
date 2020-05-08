import { Request, Response } from "express"

export const helloGET = (request: Request, response: Response) => {
  response.send("Hello World!")
}