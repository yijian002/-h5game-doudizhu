define('route', ['jquery', 'comm', 'config', 'localstorage'], function($, comm, _c, localstorage) {

    var routerUrls = {
        userInfo: 'game/userInfo.do',
        thisRank: 'game/current-rank-1.do',
        thisRankMore: 'game/current-rank.do',
        prevRank: 'game/before-rank.do',
        history: 'game/history.do',
        historyDetail: 'game/history-detail.do',
        myRecord: 'game/my-part.do',
        ticket: 'game/ticket-num.do'
    };

    var opt_key = localstorage();

    if (!comm.isWX() && _c.TYPES.others.indexOf(opt_key.snatchType) === -1) {
        return function(opts, callback) {
            callback(false);
        };
    }

    function _ajax(opts, callback) {
        $.ajax({
            url: _c.PATH + opts.url,
            data: $.extend(opt_key, opts.params),
            type: opts.type,
            cache: false,
            beforeSend: opts.beforeSend || $.noop,
            success: function(response) {
                callback(response);
            },
            error: function() {
                callback(false);
            }
        });
    }

    return function(opts, callback) {
        if (!opts) {
            callback(false);
            return;
        }

        if (!opts.key || !routerUrls[opts.key]) {
            callback(false);
            return;
        }

        opts.params = opts.params || {};
        $.extend(opts.params, { gameId: window.gameId || 1 });

        opts.type = opts.type || 'GET';
        opts.url = routerUrls[opts.key];

        _ajax(opts, function(response) {
            callback(response);
        });
    };

});
