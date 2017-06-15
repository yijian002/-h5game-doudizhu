(function(window) {

    var box_ticket_over = '<div class="w-msgbox" id="box_ticket_over">' +
        '<div class="w-msgbox-bd"><h3 class="w-msgbox-title">您的游戏券已经消耗光了<br />请继续获得更多游戏券</h3></div>' +
        '<div class="w-msgbox-ft w-msgbox-ft-2">' +
        '    <a href="../../index.html"><button class="pro-btn" type="button"><span>立即</span></button></a>' +
        '    <a href="./list.html"><button class="pro-btn pro-btn-close" type="button"><span>排行榜</span></button></a>' +
        '</div></div>',
        box_layer = '<div class="boxlayer" id="box_layer"></div>';

    var game = {
        codeId: null,
        checkCode: null,
        ising: false,
        playgaming: false,
        isTry: false,
        ticketNum: 0,
        ticket: function(callback) {
            var _this = this;

            getAjax({ url: 'game/ticket-num.do' }, function(response) {
                if (!response || response.code !== 1) {
                    callback(false);
                    alert(response.message || '系统错误或异常退出游戏[0]');
                    return;
                }

                if (response.data.ticketNum) {
                    _this.ticketNum = response.data.ticketNum;
                } else if (response.data.ticket) {
                    _this.ticketNum = 3; // @todo: 定制不同游戏的次数
                }

                if (response.data.testNum) {
                    _this.isTry = true;
                }

                if (callback) {
                    callback(true);
                }
            });
        },
        start: function(callback) {
            var _this = this;
            if (!callback) {
                console.log('Start not found the callback function.');
                return;
            }

            if (this.ising) {
                return;
            }

            this.ising = true;
            getAjax({ url: 'game/startGame.do', type: 'POST', params: { test: this.isTry ? 1 : 0 } }, function(response) {
                _this.ising = false;
                _this.playgaming = true;

                if (!response) {
                    callback(false);
                    alert(response.message || '系统错误或异常退出游戏[1]');
                } else if (response.code === 2) {
                    callback(false);
                    _this.tipTicketOver();
                } else if (response.code === 1) {
                    _this.ticketNum--;
                    _this.codeId = response.data.recordId;
                    _this.checkCode = response.data.code;

                    callback(true);
                } else if (response.code === 0) {
                    alert(response.message || '系统错误，稍候重试[1]');
                }
            });
        },
        end: function(params, callback) {
            var _this = this;

            getAjax({ url: 'game/endGame.do', type: 'POST', params: { score: params.score, recordId: this.codeId, code: this.checkCode } }, function(response) {
                _this.playgaming = false;

                if (!response || response.code !== 1) {
                    callback(false);
                    alert(response.message || '系统错误或异常退出游戏[2]');
                    return;
                }

                _this.ticketNum = response.data.ticketNum;

                if (callback) {
                    callback({
                        rank: response.data.rank,
                        best: response.data.bestScore || '-',
                        ticketNum: response.data.ticketNum
                    });
                }
            });
        },
        replay: function(callback) {
            this.isTry = false;
            this.start(function(response) {
                if (response && callback) {
                    callback();
                }
            });
        },
        bsing: function(callback) {
            var _this = this;
            if (!callback) {
                console.log('Start not found the callback function.');
                return;
            }

            if (this.ising) {
                return;
            }

            this.ising = true;
            getAjax({ url: 'game/startGame.do', type: 'POST', params: { test: this.isTry ? 1 : 0 } }, function(response) {
                _this.ising = false;
                _this.playgaming = true;

                if (!response) {
                    alert(response.message || '系统错误或异常退出游戏[1]');
                    callback(false);
                } else if (response.code === 2) {
                    _this.tipTicketOver();
                    callback(false);
                } else if (response.code === 1) {
                    _this.ticketNum--;
                    _this.codeId = response.data.recordId;
                    _this.checkCode = response.data.code;

                    callback({ r: response.data.gameRound, id: response.data.recordId, c: response.data.code });
                } else if (response.code === 0) {
                    alert(response.message || '系统错误，稍候重试[1]');
                }
            });
        },
        bend: function(params, callback) {
            var _this = this;

            getAjax({ url: 'game/end.do', type: 'POST', params: params || {} }, function(response) {
                _this.playgaming = false;

                if (!response || response.code !== 1) {
                    callback(false);
                    alert(response.message || '系统错误或异常退出游戏[2]');
                    return;
                }

                _this.ticketNum = response.data.ticketNum;
                if (!_this.ticketNum && response.data.ticket) {
                    _this.ticketNum = 3;
                }

                if (callback) {
                    callback({
                        rank: response.data.rank,
                        best: response.data.bestScore || '-',
                        ticketNum: response.data.ticketNum
                    });
                }
            });
        },
        tipTicketOver: function() {
            var $box_ticket_over = $('#box_ticket_over'),
                $box_layer = $('#box_layer');

            if (!$box_ticket_over.length) {
                $box_ticket_over = $(box_ticket_over).appendTo('body');
            }

            if (!$box_layer.length) {
                $box_layer = $(box_layer).appendTo('body');
            }

            $box_layer.show();
            $box_ticket_over.off().show().on('click', '.close', function() {
                $box_ticket_over.hide();
                $box_layer.hide();
            });
        }
    };

    function getAjax(opts, callback) {
        opts.params = opts.params || {};
        $.extend(opts.params, { gameId: window.gameId || 1 });

        $.ajax({
            url: window._c.PATH + opts.url,
            data: $.extend(window.G.userParams, opts.params),
            type: opts.type || 'GET',
            cache: false,
            beforeSend: opts.beforeSend || $.noop,
            timeout: 5000,
            success: function(response) {
                callback(response);
            },
            error: function() {
                callback(false);
            }
        });
    }

    window.STGame = game;

}(window));
