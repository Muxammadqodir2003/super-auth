import { Injectable } from '@nestjs/common';
import * as geoip from 'geoip-lite';

@Injectable()
export class SessionHelper {
  // IP manzilni aniqlash (Proxy/Cloudflare'ni ham hisobga olgan holda)
  getIpAddress(req: any): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return typeof forwarded === 'string'
        ? forwarded.split(',')[0]
        : forwarded[0];
    }
    return req.ip || req.connection?.remoteAddress || '127.0.0.1';
  }

  // IP bo'yicha joylashuvni aniqlash
  getLocation(ip: string) {
    // Agar localhost (127.0.0.1 yoki ::1) bo'lsa, geoip natija bermasligi mumkin
    const lookupIp = ip === '::1' || ip === '127.0.0.1' ? '8.8.8.8' : ip;
    const geo = geoip.lookup(lookupIp);

    return {
      country: geo?.country || 'Unknown',
      region: geo?.region || 'Unknown',
      city: geo?.city || 'Unknown',
    };
  }
}
