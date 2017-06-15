require.config({
    baseUrl: '../../',
    paths: {
        jquery: 'lib/zepto.min',
        zeptoselector: 'lib/zepto.selector',
        comm: 'js/helper/comm',
        config: 'js/config',
        localstorage: 'js/helper/init-localstorage',
        route: 'game/js/route',
        modgamelist: 'game/js/modules/list'
    },
    shim: {
        jquery: {
            exports: '$'
        },
        zeptoselector: {
            deps: ['jquery']
        },
        route: {
            deps: ['jquery', 'comm']
        },
        modgamelist: {
            deps: ['route', 'zeptoselector']
        }
    }
});


require(['jquery', 'route', 'comm', 'config', 'modgamelist', 'zeptoselector'], function($, route, comm, _c, modgamelist) {

    var tpl_rank = ['<li class="__CLASS__"><div class="num">__RANK__</div><div>',
            '<div class="m-head"><img src="__HEAD__" /></div>',
            '<span class="name">__NAME__</span></div>',
            '<div>__GRADE__</div><div>__POINT__<img src="images/icon-b.png" class="icon-b" />__ICONS__</div></li>'
        ],

        tpl_rank_rtime = ['<img src="images/rtime-txt.png" class="txt" />',
            '<div class="rtime"><span>-</span>:<span>-</span>:<span>-</span></div>'
        ],

        tpl_history = ['<li><div>第__ROUND__轮</div>',
            '<div><span class="name">__NAME__</span></div>',
            '<div>__POINT__<img src="images/icon-b.png" class="icon-b" /></div>',
            '<div><img src="images/btn-detail.png" class="btn-detail js-detail-__ROUND__" data-round="__ROUND__" /></div></li>'
        ],

        tpl_record = ['<li><div>第__ROUND__轮</div><div>__COUNT__次</div>',
            '<div>__GRADE__</div><div>第__RANK__名</div>',
            '<div>__POINT____ICONS__</div></li>'
        ],

        tpl_img_luck = '<img src="images/icon-luck.png" class="icon-luck" />';

    var TXT_F = '菜鸟';

    var $round = $('#js-round'),
        $list_rank = $('.list-rank-cont', $round),
        $history = $('#js-history'),
        $myrecords = $('#js-my-records'),
        $tabs = $('#js-tabs');

    var has_me = false,
        class_hide = 'hide';

    function initPersonal() {
        var $personal = $('#js-personal'),
            collects = modgamelist.personal._collects;

        $('.m-head img', $personal).attr('src', modgamelist.getHead({ head: collects.head, type: comm.getCookie('snatchType') }));
        $('.mine span', $personal).text(collects.name);
        $('.ticket .icon-info', $personal).text(collects.ticket);
        $('.best .icon-info', $personal).text(collects.best);

        $personal = null;

        if (collects.isFirst) { // 试玩机会
            _dialogTry();
        } else if (collects.lastGame) { // 上轮游戏结果
            _dialogResults(collects.lastGame);
        } else if (!collects.ticket && !collects.ticketNum) { // 游戏券0，次数0
            _dialogTicket();
        }

        function _dialogTry() {
            var $tpl = $($('#tpl-box-trygame').html()).appendTo('body');
            collects.isFirst = false;

            setTimeout(function() {
                dialog($tpl);
            }, 600);
        }

        function _dialogTicket() {
            var $tpl = $($('#tpl-box-ticket').html()).appendTo('body');

            setTimeout(function() {
                dialog($tpl);
            }, 600);
        }

        function _dialogResults(game) {
            var $tpl = $($('#tpl-box-results').html()).appendTo('body');

            $('.best', $tpl).text(game.gameScore > 0 ? (game.gameScore + '倍') : TXT_F);
            $('.rank', $tpl).text('第' + game.rank + '名');

            var reward = game.award + '币';
            if (game.lucky === 1) {
                reward += '<span>（幸运奖中奖用户）</span>';
            }
            $('.reward', $tpl).html(reward);

            $('.detail', $tpl).on('click.detail', function() { // 查看上轮详情
                $('li.selected', $tabs).removeClass('selected');
                $('li:eq(2)', $tabs).addClass('selected');

                initHistory(function() {
                    rankMySelf('hide');
                    setTimeout(function() {
                        $('.js-detail-' + game.round, $history).trigger('click');
                    }, 50);
                });
            });

            setTimeout(function() {
                dialog($tpl);
            }, 600);
        }
    }

    function initThisRank() {
        renderRank(modgamelist.thisRank);
    }

    function rankMySelf(action) {
        if (!modgamelist.thisRank._collects.myself) {
            return;
        }

        if (action === 'hide' || modgamelist.thisRank._hasMe) {
            $('.js-myself').addClass(class_hide);
            return;
        }

        if (!$('.bottom-mine').length) {
            _append();
        }

        $('.js-myself').removeClass(class_hide);

        function _append() {
            var myself = modgamelist.thisRank._collects.myself,
                tpl = $('#tpl-myself').html()
                .replace(/__RANK__/, myself.rank)
                .replace(/__HEAD__/, modgamelist.getHead({ head: myself.userHead, type: comm.getCookie('snatchType') }))
                .replace(/__NAME__/, myself.nickname)
                .replace(/__GRADE__/, myself.gameScore > 0 ? (myself.gameScore + '倍') : TXT_F)
                .replace(/__POINT__/, myself.award);

            $('body').append(tpl);
        }
    }

    function initPrevRank() {
        var rank = modgamelist.prevRank;

        if (rank._init) {
            rank._init(function() {
                renderRank(rank);
            });
        } else {
            renderRank(rank);
        }
    }

    function renderRank(modRank) {
        var $info = $('.round-info', $round),
            collects = modRank._collects;

        $('.num', $info).text(collects.round);
        $('.total', $info).text(collects.totalPrize + '币');

        $('.back', $info).addClass(class_hide);
        showTabsContent('rank');

        if (modRank._status === 'ing') {
            $('.end', $info).addClass(class_hide);
            $('.rtime', $info).removeClass(class_hide);

            _list();
            _clocking();
        } else if (modRank._status === 'end') {
            $('.rtime', $info).addClass(class_hide);
            $('.end', $info).removeClass(class_hide);

            _list();
        } else if (modRank._status === 'rtime') {
            _rtime();
        }

        function _list() {
            $list_rank.removeClass(class_hide);
            $('.list-rank-top', $round).removeClass(class_hide);
            $('.rank-rtime', $round).addClass(class_hide);

            renderRankList(collects.list);
            renderMore($('.more', $list_rank), modRank, function(list) {
                renderRankList(list, true);

                if ($('li.selected', $tabs).index() === 0) { // 本轮:判断有没有自己的成绩在榜单
                    rankMySelf();
                }
            });
        }

        function _clocking() { // 本轮
            initClock($('.rtime', $info), modRank._collects.rtime, function() {
                setTimeout(function() {
                    _thisToPrevRank();
                }, 1000);
            });
        }

        function _rtime() {
            $('.rtime', $info).addClass(class_hide);
            $('.end', $info).removeClass(class_hide);

            $list_rank.addClass(class_hide);
            $('.list-rank-top', $round).addClass(class_hide);
            $('.rank-rtime', $round).html(tpl_rank_rtime.join('')).removeClass(class_hide);

            initClock($('.rank-rtime .rtime', $round), modRank._collects.rtime, function() {
                setTimeout(function() {
                    _refreshPrevRank();
                }, 1000);
            });
        }

        function _thisToPrevRank() {
            modgamelist.prevRank._reset(function() {
                var idx = $('li.selected', $tabs).index();
                if (idx === 0) { // 当前状态在查看本轮
                    $('li:eq(1)', $tabs).trigger('click'); // 上轮Tab
                }

                modgamelist.thisRank._reset(function() {});
            });
        }

        function _refreshPrevRank() {
            modgamelist.prevRank._reset(function() {
                var idx = $('li.selected', $tabs).index();
                if (idx === 1) { // 当前状态在查看上轮
                    $('li:eq(1)', $tabs).removeClass('selected').trigger('click'); // 上轮Tab
                }
            });
        }
    }

    function renderRankList(list, isAppend) {
        var htmls = [],
            tpl = tpl_rank.join(''),
            item;
        for (var i = 0, len = list.length; i < len; i++) {
            item = list[i];
            htmls[i] = tpl.replace(/__CLASS__/, item.myself ? 'me' : '')
                .replace(/__RANK__/, getRankIcon(item.rank))
                .replace(/__HEAD__/, modgamelist.getHead(item))
                .replace(/__NAME__/, item.name)
                .replace(/__GRADE__/, item.grade > 0 ? (item.grade + '倍') : TXT_F)
                .replace(/__POINT__/, item.point)
                .replace(/__ICONS__/, item.isLuck ? tpl_img_luck : '');
        }

        if (isAppend) {
            $('ul', $list_rank).append(htmls.join(''));
        } else {
            $('ul', $list_rank).html(htmls.join(''));
        }
        htmls = null;
    }

    function initHistory(callback) {
        var history = modgamelist.history;

        if (history._init) {
            history._init(function() {
                renderHistory();

                if (callback) {
                    callback();
                }
            });
        } else {
            renderHistory();

            if (callback) {
                callback();
            }
        }
    }

    function renderHistory() {
        var collects = modgamelist.history._collects;
        $('.total', $history).text(collects.totalPrize + '币');

        showTabsContent('history');
        renderHistoryList(collects.list);
        renderMore($('.more', $history), modgamelist.history, function(list) {
            renderHistoryList(list, true);
        });
    }

    function renderHistoryList(list, isAppend) {
        var htmls = [],
            tpl = tpl_history.join(''),
            item;
        for (var i = 0, len = list.length; i < len; i++) {
            item = list[i];
            htmls[i] = tpl.replace(/__ROUND__/g, item.round)
                .replace(/__NAME__/, item.win)
                .replace(/__POINT__/, item.point);
        }

        if (isAppend) {
            $('.list-cont ul', $history).append(htmls.join(''));
        } else {
            $('.list-cont ul', $history).html(htmls.join(''));
        }
        htmls = null;
    }

    function showHistoryDetail(round, isAppend) {
        modgamelist.history._detail(round, isAppend, function(history, nextList) {
            if (!history) {
                alert('历史详情返回错误');
                return;
            }

            if (!isAppend) { // Init detail list
                $('.num', $round).text(history.round);
                $('.total', $round).text(history.point + '币');

                $('.rtime', $round).addClass(class_hide);
                $('.end', $round).addClass(class_hide);
                $('.rank-rtime', $round).addClass(class_hide);
                $('.back', $round).removeClass(class_hide).off().on('click', initHistory);

                showTabsContent('rank');
                $list_rank.removeClass(class_hide);
                $('.list-rank-top', $round).removeClass(class_hide);

                renderRankList(history.detail._list);
            } else {
                renderRankList(nextList, true);
            }

            var $more = $('.more', $list_rank);
            if (history.detail._endPage) {
                $more.off().text('没有更多了');
                return;
            }

            $more.text('查看更多').off().on('click', function() {
                $more.off().text('正在努力加载数据...');
                showHistoryDetail(round, true);
            });
        });
    }

    function initMyRecords() {
        $myrecords.removeClass(class_hide);
        $round.addClass(class_hide);
        $history.addClass(class_hide);
        $tabs.addClass(class_hide);

        if (modgamelist.myRecords._init) {
            modgamelist.myRecords._init(renderMyRecords);
        }
    }

    function renderMyRecords() {
        renderMyRecordsList(modgamelist.myRecords._collects.list);

        renderMore($('.more', $myrecords), modgamelist.myRecords, function(list) {
            renderMyRecordsList(list, true);
        });
    }

    function renderMyRecordsList(list, isAppend) {
        var htmls = [],
            tpl = tpl_record.join(''),
            item,
            icons,
            point;
        for (var i = 0, len = list.length; i < len; i++) {
            item = list[i];
            point = item.point + '<img src="images/icon-b.png" class="icon-b" />';

            if (item.isLuck) {
                icons = tpl_img_luck;
            } else if (item.round === modgamelist.thisRank._collects.round && modgamelist.thisRank._status === 'ing') {
                icons = '<span class="red">进行中...</span>';
                point = '';
            } else {
                icons = '';
            }

            htmls[i] = tpl.replace(/__ROUND__/, item.round)
                .replace(/__COUNT__/, item.count)
                .replace(/__GRADE__/, item.grade > 0 ? (item.grade + '倍') : TXT_F)
                .replace(/__RANK__/, item.rank)
                .replace(/__POINT__/, point)
                .replace(/__ICONS__/, icons);
        }

        if (isAppend) {
            $('.list-cont ul', $myrecords).append(htmls.join(''));
        } else {
            $('.list-cont ul', $myrecords).html(htmls.join(''));
        }
        htmls = null;
    }

    function renderMore($more, mod, callback) {
        if (mod._pageNo === 1 && !mod._collects.list.length) {
            $more.off().text('暂无相关数据~');
            return;
        }

        if (mod._endPage) {
            $more.off().text('没有更多了');
            return;
        }

        $more.text('查看更多').off().on('click', function() {
            $more.off().text('正在努力加载数据...');

            mod._nextPage(function(list) {
                callback(list);
                renderMore($more, mod, callback);
            });
        });
    }

    function showTabsContent(type) {
        if (type === 'rank') {
            $('.more', $list_rank).off().text('正在努力加载数据...');
            $('ul', $list_rank).empty();

            $round.removeClass(class_hide);
            $history.addClass(class_hide);
        } else if (type === 'history') {
            $('.more', $history).off().text('正在努力加载数据...');
            $('.list-cont ul', $history).empty();

            $history.removeClass(class_hide);
            $round.addClass(class_hide);
        }
    }

    function getRankIcon(rank) {
        if (rank > 0 && rank <= 3) {
            rank = '<img src="images/num-' + rank + '.png" />';
        }

        return rank;
    }

    function loadMore(opts) {
        var options = { loading: $.noop, offset: 50 },
            timer = null;
        $.extend(options, opts || {});

        function _bind() {
            $(window).off('scroll.loadmore').on('scroll.loadmore', function() {
                clearTimeout(timer);
                timer = setTimeout(function() {
                    if (_canLoad()) options.loading();
                }, 50);
            });
        }

        function _canLoad() {
            return (document.documentElement.scrollHeight) <= (document.documentElement.scrollTop | document.body.scrollTop) + document.documentElement.clientHeight + options.offset;
        }

        function _init() {
            _bind();
        }
        _init();
    }

    function goTop(opts) {
        var options = $.extend({ cont: $('#btn-back-top') }, opts || {});
        if (!options.cont.length) {
            return;
        }

        var $win = $(window),
            $body = $('body');
        class_top = 'button-backtop',
            win_h = $win.height(),
            timer = null;

        options.cont.on('click', function() {
            $body.scrollTop(0);
        });

        $win.off('scroll.top').on('scroll.top', function() {
            clearTimeout(timer);
            timer = setTimeout(function() {
                _toggle();
            }, 50);
        });

        function _toggle() {
            if ($body.scrollTop() >= win_h) {
                options.cont.show().addClass(class_top);
            } else {
                options.cont.hide();
            }
        }
    }

    function eventBind() {
        $tabs.on('click', 'li', function() {
            if ($(this).hasClass('selected')) {
                return;
            }

            $(this).addClass('selected').siblings().removeClass('selected');

            var o_inits = {
                    0: function() {
                        initThisRank();
                        rankMySelf();
                    },
                    1: function() {
                        initPrevRank();
                        rankMySelf('hide');
                    },
                    2: function() {
                        initHistory();
                        rankMySelf('hide');
                    }
                },
                idx = $(this).index();

            if (typeof o_inits[idx] !== 'function') {
                console.log('Init failed, object[' + idx + '] isnot function.');
                return;
            }

            o_inits[idx]();
        });

        $('.list-cont', $history).on('click', '.btn-detail', function() { // 查看历史详情
            showHistoryDetail($(this).data('round'));
        });

        $('#js-btn-myrecords').on('click', function() { // 我的参与记录
            $(this).find('.img').addClass('selected');

            initMyRecords();
            rankMySelf('hide');
        });

        $('.back', $myrecords).on('click', function() {
            $('#js-btn-myrecords .img').removeClass('selected');

            $tabs.removeClass(class_hide).find('li.selected').removeClass('selected').trigger('click'); // 重置Tab状态
            $myrecords.addClass(class_hide);
        });

        $('.main').on('click', '.icon-luck', function() { // 幸运用户
            dialog($('#box_luck_tip'));
        });

        $('.icon-refresh').on('click', function() {
            window.location.href = _c.TPL_PATH + 'game/qdz/list.html?_=' + new Date().getTime();
        });
    }

    function initClock($clock, rtime, callback) {
        var h_span = $('span:first', $clock),
            m_span = $('span:eq(1)', $clock),
            s_span = $('span:last', $clock),
            time_interval = null;

        function _update() {
            var t = _rtime(rtime);

            h_span.text(t.h);
            m_span.text(t.m);
            s_span.text(t.s);

            return t.t;
        }

        function _zero(v) {
            return v < 10 ? ('0' + v) : v;
        }

        function _rtime(r) {
            var total = r - new Date().getTime();
            total = total < 0 ? 0 : total;

            var seconds = Math.floor((total / 1000) % 60),
                minutes = Math.floor((total / 1000 / 60) % 60),
                hours = Math.floor((total / 1000 / 60 / 60) % 24);

            return {
                t: total,
                h: _zero(hours),
                m: _zero(minutes),
                s: _zero(seconds)
            };
        }

        function _init() {
            _update();

            time_interval = setInterval(function() {
                if ($clock.is(':hidden')) {
                    clearInterval(time_interval);
                    return;
                }

                var total = _update();
                if (total <= 0) {
                    clearInterval(time_interval);
                    if (callback) {
                        callback();
                    }
                }
            }, 1000);
        }
        _init();
    }

    function dialog($dialog, type) {
        type = type || 'open';

        var $layer = $('#js-box-layer');
        if (type === 'open') {
            $layer.show();
            $dialog.show().off('click.close').on('click.close', '.close', function() {
                dialog($dialog, 'close');
            });
        } else if (type === 'close') {
            $layer.hide();
            $dialog.hide();
        }
    }

    function init() {
        modgamelist.personal._update(initPersonal);

        modgamelist.thisRank._init(function() {
            initThisRank();
            rankMySelf();

            eventBind();
            goTop();
            loadMore({
                loading: function() {
                    $('.more:visible').trigger('click');
                }
            });
        });

        window.localStorage.setItem('wxdatasnatch_game100c_num', '');
    }
    init();
});
