define( function() {

  var enviroment
    , development
    , production;

  development = {
      server: {
        port: 3001
      }
    , mysql: {
          db    : 'phpbb'
        , host  : '127.0.0.1'
        , user  : 'filos'
        , pass  : '1234'
        , table : {
              users       : 'phpbb_users'
            , fields_data : 'phpbb_profile_fields_data'
          }
      }
    , json: {
          students  : 'http://foros.local/students.json'
        , faculty   : ''
      }
  };

  production = {
      server: {
        port: 3001
      }
    , mysql: {
          db    : 'foros'
        , host  : 'localhost'
        , user  : 'foros'
        , pass  : 'foR0$Fi10s'
        , table : {
              users       : 'phpbb_users'
            , fields_data : 'phpbb_profile_fields_data'
          }
      }
    , json: {
          students  : 'http://servicios.galileo.filos.unam.mx/foros'
        , faculty   : ''
      }
  };

  if( 'production' === process.env.NODE_ENV ){
    enviroment = production;
  } else {
    enviroment = development;
  }

  return enviroment;

});