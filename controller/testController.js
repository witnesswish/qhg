const axios = require("axios");

class TestController {
  async index(ctx) {
    const ip = ctx.ip;
    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      params: {
        fields:
          "status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query",
      },
      timeout: 5000,
    });
    ctx.body = {
      code: 200,
      ip: ip,
      data: response.data,
    };
  }
}

module.exports = new TestController();
