import { Request, Response } from "express"

export const ghProxy = (request: Request, response: Response) => {
  response.send("Hello World!")
}