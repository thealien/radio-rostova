//	JavaScript API 2.0 for Uppod 1+
//  http://uppod.ru/js
'use strict';
(function (window) {
    var global = window,
        document = global.document;

    global.uppodEvent = function (playerID, event) {
        switch(event){
            case 'init':
                break;
            case 'start':
                break;
            case 'play':
                break;
            case 'pause':
                break;
            case 'stop':
                break;
            case 'seek':
                break;
            case 'loaded':
                break;
            case 'end':
                break;
            case 'download':
                break;
            case 'quality':
                break;
            case 'error':
                break;
            case 'ad_end':
                break;
            case 'pl':
                break;
        }
    };

    global.uppodSend = function (playerID, com/*, callback*/) {
        document.getElementById(playerID).sendToUppod(com);
    };

    global.uppodGet = function (playerID, com/*, callback*/) {
        return document.getElementById(playerID).getUppod(com);
    };

})(window);