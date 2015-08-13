import Hapi from 'hapi';
import * as config from './utils/conf_loader';

export function createServer() {
  return new Promise(function (resolve, reject) {
    let conf = config.reload();

    // Compute mongodb url from detailed information
    let registereds = [];
    let dbOpts = [];
    let clients = conf.get('clients');
    Object.keys(clients).forEach((clientName) => {
      let client = clients[clientName];
      let dbOpt = {};
      let index = dbOpts.length;

      dbOpt.url = client.url;
      dbOpts.push(dbOpt);

      registereds.push({
        register: require('./controller/profile'),
        options: {
          routePrefix: client.routePrefix,
         dbIndex: index
        }
      });
    });

    registereds.unshift({
      register: require('hapi-mongodb'),
      options: dbOpts
    });

    let server = new Hapi.Server();

    server.connection({
      port: conf.get('server.port'),
      host: conf.get('server.host'),
      routes: {
        cors: true
      }
    });

    server.register(registereds, function (registrationError) {
      if (registrationError) {
        return reject(registrationError);
      } else {
        return resolve(server);
      }
    });
  });
}
