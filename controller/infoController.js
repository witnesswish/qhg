const axios = require('axios');

class InfoController {
  async ip(ctx) {
    const ip = ctx.ip;
    let apiret;
    if (ip != '::ffff:127.0.0.1') {
      apiret = await axios.get(`http://ip-api.com/json/${ip}`, {
        params: {
          fields:
            'status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query'
        },
        timeout: 5000
      });
    }
    ctx.body = {
      code: 200,
      ip: ip,
      data: apiret ? apiret.data : 'null'
    };
  }
}

module.exports = new InfoController();
