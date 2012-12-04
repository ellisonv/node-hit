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
  
  interface.count = function(event, start, stop, onReady) {
    hashes = new Array();
    for (i=start-(start%conf['event-granularity']);i<=stop;i+=conf['event-granularity']) {
      hashes.push('hit_'+i.toString());
    }
    var iterated = 0;
    var total = 0;
    hashes.forEach(function(hash) {
      r.hget(hash, event, function(err, res) {
        iterated++;
        if (res) total+=parseInt(res);
        if (iterated===hashes.length) onReady(null, total);
      });
    });
  }
  
  interface.list = function(event, start, stop, a, b) {
    var onReady = b||a;
    var listGranularity = conf['event-granularity'];
    if (typeof a!=='function') {listGranularity = a};
    var hashes= new Array();
    for (i=start-(start%conf['event-granularity']);i<=stop;i+=conf['event-granularity']) {
      hashes.push('hit_'+i.toString());
    }
    var iterated = 0;
    var counts = new Object();
    hashes.forEach(function(hash) {
      r.hget(hash, event, function(err, res) {
        var hashTime = parseInt(hash.substr(4));
        var key =hashTime-(hashTime%listGranularity);
        counts[key] = counts[key]||0;
        if (res) {counts[key] += parseInt(res)};
        iterated++;
        if (iterated===hashes.length) {
          var list = new Array();
          var times = new Array();
          for (time in counts) {times.push(time)};
          times.sort();
          for (i=0;i<times.length;i++) {list.push(counts[times[i]])};
          onReady(null, list);
        }
      });
    });
  }
  
  interface.events = function(start, stop, onReady) {
    var hashes= new Array();
    for (i=start-(start%conf['event-granularity']);i<=stop;i+=conf['event-granularity']) {
      hashes.push('hit_'+i.toString());
    }
    var iterated = 0;
    var events = new Object();
    hashes.forEach(function(hash) {
      r.hkeys(hash, function(err, res) {
        for (i=0;i<res.length;i++) {events[res[i]]=true};
        iterated++;
        if (iterated===hashes.length) onReady(null, Object.keys(events));
      });
    });
  }
  
  return interface;
  
}