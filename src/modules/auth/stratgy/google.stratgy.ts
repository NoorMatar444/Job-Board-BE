import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

export type GoogleProfileUser = {
  googleId: string;
  email: string;
  userName: string;
  profilePicture?: string;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly ConfigService: ConfigService) {
    super({
      clientID: ConfigService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: ConfigService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: ConfigService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }
  authorizationParams(options: {
    accessType?: string;
    prompt?: string;
    hl?: string;
  }): Record<string, string> {
    const params: Record<string, string> = {};
    if (options.accessType) {
      params.access_type = options.accessType;
    }
    if (options.prompt) {
      params.prompt = options.prompt;
    }
    if (options.hl) {
      params.hl = options.hl;
    }
    return params;
  }
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): GoogleProfileUser {
    const email = profile.emails?.[0]?.value;
    const verifiedEmail = profile.emails?.[0]?.verified;
    if (!email || verifiedEmail === false) {
      throw new UnauthorizedException('email not verified yet');
    }
    return {
      googleId: profile.id,
      email: email.toLowerCase(),
      userName: profile.displayName?.trim() || email.split('@')[0] || 'user',
      profilePicture: profile.photos?.[0]?.value,
    };
  }
}
