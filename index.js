var conf = require('./conf/config');
module.exports = function(a, b) {
  
  typeof a==='object' ? r = a : r = require('redis').createClient(a, b);
  
  var interface = function(event, onReady) {
    var now = new Date().getTime();
    var hash = 'hit_'+(now-(now%conf['event-granularity'])).toString();
    r.hincrby(hash, event, 1, function(err, res) {
      if (res===1) {
         r.expire(hash, conf['event-expiration']/1000);
      }
    });
  }
  
  interface.count = function(event, start, stop) {
    console.log(event);
    console.log(start);
    console.log(stop)
    hashes = new Array();
    for (i=start;i<=stop;i++) {
      if (i%conf['event-granularity']===0) {hashes.push('hit_'+i.toString())};
    }
    console.log(hashes)
  }
  return interface;
  
}