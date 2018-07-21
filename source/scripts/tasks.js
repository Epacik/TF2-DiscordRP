const ps = require('ps-node');
let discordIsOn = false;

function lookup(cmd, arg) {
  ps.lookup({
      command: cmd,
      arguments: arg,
      }, function(err, resultList ) {
      if (err) {
          throw new Error( err );
      }

      resultList.forEach(function( process ){
          if( process ){

              console.log( 'PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments );
          }
      });
  });
}

module.exports = {
  test: 'lol',
  testM: function() {
    module.exports.test = 'xD';
  },
  lookup,
};
