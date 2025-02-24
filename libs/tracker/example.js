var tracker_module = require('./index.js');

var tracker = tracker_module.create(require('./example.config.js').sources);

tracker.on('dataUpdate', function(name, track){
    console.log(new Date(), tracker.format(track));
});

tracker.start();