import { Response, Request } from "express"
import HealthCheck from "../utils/interface/HealthCheck"
export default (httpRequest: Request, httpResponse: Response) => {
    const response: HealthCheck = {
        name: "api-gen",
        alive: true,
        author: "Nathaniel Anum Adjah",
        environment: `${process.env.API_GEN_ENVIRONMENT}`
    }
    return httpResponse.json(response)
}