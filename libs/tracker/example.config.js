var sources = [];

// import data from LastFm (source) to Icecast (destination)
sources.push({

    name:  'radiorostov',

    source: {
        type: 'lastfm',
        // config for lastfm checker
        config: {
            channel: 'radiorostova',
            credential: {
                api_key:    '*******lastfm*****api****key' // replace me
            },
            defaultTrack: {
                name:   'RadioRostov.ru',
                artist: 'Радио Ростова на 101.6 FM',
                album:  '',
                ts:     0
            },
            refreshTime: 5
        }
    },

    modifiers: [
        function (data){
            var replaces = {
                'PADUO POCTOBA': 'Радио Ростова'
            };
            if (data && data.artist) {
                data.artist = replaces[data.artist] || data.artist;
            }
            return data;
        },
        function (data){
            var replaces = {
                'WEATHER REPORT':   'Прогноз Погоды',
                'CULTURE':          'Культобстрел',
                'YA, KLETZKI!':     'Ya, Kletzki!',
                'MUSIC CALENDAR':   'Музыкальный Календарь'
            };
            if (data && data.name) {
                data.name = replaces[data.name] || data.name;
            }
            return data;
        }
    ],

    destinations: [
        {
            type: 'icecast',
            config: {
                mounts: [
                    'rostovradiofm',
                    'rostovradio'
                ],
                credential: {
                    username: 'admin', // login for icecast
                    password: 'password' // pass for icecast
                },
                net: {
                    host: 'localhost',
                    port: '8000'
                }
            }
        }
    ]
});

exports.sources = sources;