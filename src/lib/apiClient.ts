import { createCognitoAuth } from "@hasegawa-zoen/api-client";
import { config } from "./config";

export const cognitoAuth = createCognitoAuth({
  userPoolId: config.cognitoUserPoolId,
  clientId: config.cognitoAppClientId,
});
