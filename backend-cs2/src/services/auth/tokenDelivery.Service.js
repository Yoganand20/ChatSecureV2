export default class TokenDeliveryService {
  static setRefreshTokenCookie(res, refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }

  static setAccessTokenHeader(res, accessToken) {
    res.set('X-Access-Token', accessToken);
  }

  static setTokensSecurely(res, { accessToken, refreshToken }) {
    this.setAccessTokenHeader(res, accessToken);
    this.setRefreshTokenCookie(res, refreshToken);
  }

  static clearTokens(res) {
    res.clearCookie('refreshToken');
    res.removeHeader('X-Access-Token');
  }
}
