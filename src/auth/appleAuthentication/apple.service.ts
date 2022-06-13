import { Injectable, ForbiddenException } from '@nestjs/common';
import * as appleSignin from 'apple-signin';
import path = require('path');

@Injectable()
export class AppleService {
  public getHello(): string {
    return 'Hello World dfs!';
  }

  public async verifyUser(payload: any): Promise<any> {
    const clientSecret = appleSignin.getClientSecret({
      clientID: process.env.APPLE_CLIENT_ID,
      teamId: process.env.APPLE_TEAM_ID,
      keyIdentifier: process.env.APPLE_KEY_ID,
      privateKeyPath: path.join(__dirname, '/secrets/appleKey.p8'),
    });

    const tokens = await appleSignin.getAuthorizationToken(payload.code, {
      clientID: process.env.APPLE_CLIENT_ID,
      clientSecret: clientSecret,
      redirectUri: 'https://auth.example.com/auth/apple',
    });

    if (!tokens.id_token) {
      console.log('Token ID not found');
      throw new ForbiddenException();
    }

    console.log('tokens', tokens);

    const data = await appleSignin.verifyIdToken(tokens.id_token);
    return { data, tokens };
  }
}