var conf = require('./conf/config');
module.exports = function(a, b) {
  
  typeof a==='object' ? r = a : r = require('redis').createClient(a, b);
  
  var interface = function(event, onReady) {
    var now = new Date().getTime();
    var hash = 'hit_'+(now-(now%conf['event-granularity'])).toString();
    r.hincrby(hash, event, 1, function(err, res) {
      if (res===1) {
         r.expire(hash, conf['event-expiration']);
      }
    });
  }
  
  interface.count = function(event, start, stop) {
    console.log(event)
  }
  return interface;
  
}