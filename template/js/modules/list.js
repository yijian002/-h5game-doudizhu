define('modgamelist', ['jquery', 'route', 'config'], function($, route, _c) {

    // var test_rank = [
    //                 {rank: 1, name: '搞基吧', head: "http://wx.qlogo.cn/mmopen/klqjBvBYvm5YokfCnIYxUr8Y7ngrB1a7Mbrz8c2lBicaQpPAjNXQ5NMNgIrp0zic4RahFtP57yEEsNdjTCtZI3hWfEVmCYicp5z/0", grade: 250, point: 100, isLuck: false, type: 2},
    //                 {rank: 2, name: '搞基吧', head: '', grade: 220, point: 60, isLuck: true, type: 1},
    //                 {rank: 3, name: '搞基吧搞基吧搞基吧搞基吧搞基吧搞基吧', head: '', grade: 220, point: 60, isLuck: true, type: 3},
    //                 {rank: 4, name: '搞基吧', head: "/upload/user/1455882896103_369648140.jpg", grade: 220, point: 60, isLuck: true, type: 3}
    //             ],
    //     test_histoy = [
    //                 {round: '010', win: '昵称昵称', point: 400, detail: {_status: 'end', _pageNo: 0, _endPage: false, _list: []}},
    //                 {round: '009', win: '昵称昵称', point: 200, detail: {_status: 'end', _pageNo: 0, _endPage: false, _list: []}},
    //                 {round: '008', win: '昵称昵称', point: 300, detail: {_status: 'end', _pageNo: 0, _endPage: false, _list: []}}
    //             ],
    //     test_records = [
    //                 {round: '011', count: 3, grade: 233, rank: 2, point: 100, isLuck: false},
    //                 {round: '010', count: 5, grade: 233, rank: 6, point: 30, isLuck: false},
    //                 {round: '009', count: 6, grade: 220, rank: 5, point: 20, isLuck: true}
    //             ];

    var personal = {
        _collects: {
            head: '',
            name: '',
            ticket: 0,
            ticketNum: 0,
            best: 0,
            isFirst: false,
            lastGame: null // round: gameScore: rank: award: lucky:
        },
        _get: function(callback) {
            route({ key: 'userInfo' }, function(response) {
                if (!response || response.code !== 1) {
                    callback(false);
                    return;
                }

                callback({
                    head: response.data.head,
                    name: response.data.nickname,
                    ticket: response.data.ticket,
                    ticketNum: response.data.ticketNum,
                    best: response.data.bestScore,
                    isFirst: response.data.hasTry,
                    lastGame: response.data.lastGame || null
                });
            });
        },
        _update: function(callback) {
            var _this = this;

            this._get(function(response) {
                $.extend(_this._collects, response);

                if (callback) {
                    callback();
                }
            });
        }
    };

    var thisRank = {
        _get: function(callback) {
            var _this = this;

            route({ key: 'thisRank' }, function(response) {
                if (!response) {
                    callback(false);
                    return;
                }

                if (response.code === 1) {
                    var list = [];
                    for (var i = 0, len = response.data.list.length; i < len; i++) {
                        list[i] = _this._getItem(response.data.list[i]);
                    }

                    _this._status = 'ing';
                    _this._collects.round = response.data.gameRound;
                    _this._collects.totalPrize = response.data.totalAward;
                    _this._collects.rtime = getEndTime(response.data.countdown * 1000);
                    _this._collects.list = mergeArr(_this._collects.list, list);
                    _this._collects.myself = response.data.userInfo || null;

                    if (callback) {
                        callback(list);
                    }
                } else if (response.code === 2) { // 当前没有进行中的游戏
                    _this._endPage = true;
                    callback([]);
                }
            });
        },
        _next: function(callback) {
            var _this = this;

            route({ key: 'thisRankMore', params: { pageNo: _this._pageNo } }, function(response) {
                if (!response) {
                    callback(false);
                    return;
                }

                if (response.code === 1) {
                    var list = [];
                    for (var i = 0, len = response.data.list.length; i < len; i++) {
                        list[i] = _this._getItem(response.data.list[i]);
                    }

                    if (!list.length) {
                        _this._endPage = true;
                    } else {
                        _this._collects.list = mergeArr(_this._collects.list, list);
                    }

                    if (callback) {
                        callback(list);
                    }
                }
            });
        },
        _nextPage: function(callback) {
            this._pageNo++;
            this._next(callback);
        },
        _getItem: function(item) {
            var params = {
                rank: item.rank,
                name: item.nickname,
                head: item.userHead,
                grade: item.gameScore,
                point: item.award,
                isLuck: false,
                type: item.snatchType
            };

            if (!this._hasMe && item.mine === 1) {
                this._hasMe = true;
                params.myself = true;
            }

            return params;
        },
        _reset: function(callback) {
            var opts = {
                _hasMe: false,
                _status: 'end',
                _pageNo: 1,
                _endPage: false,
                _collects: {
                    round: '-',
                    totalPrize: 0,
                    rtime: 0,
                    myself: null, // rank:排名 userHead:头像 nickname:昵称 gameScore:成绩 award:奖励币
                    list: []
                }
            };

            $.extend(true, this, opts);

            this._get(function() {
                if (callback) {
                    callback();
                }
            });
        },
        _init: function(callback) {
            var _this = this;

            this._reset(function() {
                callback();
                delete _this._init;
            });
        }
    };

    var prevRank = {
        _get: function(callback) {
            var _this = this;

            route({ key: 'prevRank' }, function(response) {
                if (!response) {
                    callback(false);
                    return;
                }

                if (response.code === 1) {
                    var list = [];

                    _this._collects.round = response.data.gameRound;
                    _this._collects.totalPrize = response.data.totalAward;

                    if (response.data.type === 1) {
                        _this._status = 'rtime';
                        _this._collects.rtime = getEndTime(response.data.countdown * 1000);
                    } else {
                        for (var i = 0, len = response.data.list.length; i < len; i++) {
                            list[i] = _this._getItem(response.data.list[i]);
                        }
                        _this._collects.list = mergeArr(_this._collects.list, list);
                        _this._status = 'end';
                    }

                    if (callback) {
                        callback(list);
                    }
                } else if (response.code === 2) { // 没有上一轮记录
                    _this._endPage = true;
                    callback(false);
                }
            });
        },
        _next: function(callback) {
            var _this = this;

            route({ key: 'historyDetail', params: { gameId: 1, gameRound: this._collects.round, pageNo: this._pageNo } }, function(response) { // @todo: config gameId
                if (!response && response.code !== 1) {
                    callback(false);
                    return;
                }

                var list = [];
                for (var i = 0, len = response.data.list.length; i < len; i++) {
                    list[i] = _this._getItem(response.data.list[i]);
                }

                if (!list.length) {
                    _this._endPage = true;
                } else {
                    _this._collects.list = mergeArr(_this._collects.list, list);
                }

                if (callback) {
                    callback(list);
                }
            });
        },
        _nextPage: function(callback) {
            this._pageNo++;
            this._next(callback);
        },
        _getItem: function(item) {
            var params = {
                rank: item.rank,
                name: item.nickname,
                head: item.userHead,
                grade: item.gameScore,
                point: item.award,
                isLuck: item.lucky === 1 ? true : false,
                type: item.snatchType
            };

            if (item.mine === 1) {
                params.myself = true;
            }

            return params;
        },
        _reset: function(callback) {
            var opts = {
                _hasMe: false,
                _status: 'end', // end, rtime
                _pageNo: 1,
                _endPage: false,
                _collects: {
                    round: '-',
                    totalPrize: 0,
                    rtime: 0,
                    list: []
                }
            };

            $.extend(true, this, opts);

            this._get(function() {
                if (callback) {
                    callback();
                }
            });
        },
        _init: function(callback) {
            var _this = this;

            this._reset(function() {
                callback();
                delete _this._init;
            });
        }
    };

    var history = {
        _pageNo: 1,
        _endPage: false,
        _collects: {
            totalPrize: 0,
            list: []
        },
        _get: function(callback) {
            var _this = this;

            route({ key: 'history', params: { pageNo: _this._pageNo } }, function(response) {
                if (!response && response.code !== 1) {
                    callback(false);
                    return;
                }

                var list = [];
                for (var i = 0, len = response.data.list.length; i < len; i++) {
                    list[i] = _this._getItem(response.data.list[i]);
                    // console.log(list[i]);
                }

                if (_this._pageNo === 1) {
                    _this._collects.totalPrize = response.data.totalPrize;
                }

                if (!list.length) {
                    _this._endPage = true;
                } else {
                    _this._collects.list = mergeArr(_this._collects.list, list);
                }

                if (callback) {
                    callback(list);
                }
            });
        },
        _nextPage: function(callback) {
            this._pageNo++;
            this._get(callback);
        },
        _getItem: function(item) {
            return {
                round: item.gameRound,
                win: item.nickname,
                point: item.totalAward,
                detail: { _status: 'end', _pageNo: 0, _endPage: false, _list: [] }
            };
        },
        _detail: function(round, isNext, callback) {
            var _this = this,
                item = null;

            for (var i = 0, len = this._collects.list.length; i < len; i++) {
                if (round === this._collects.list[i].round) {
                    item = this._collects.list[i];
                    break;
                }
            }

            if (!item || !item.detail) {
                callback(false);
            } else if (item.detail._endPage) {
                callback(item);
            } else if (item.detail._pageNo > 0 && !isNext) {
                callback(item);
            } else {
                item.detail._pageNo++;

                this._detailPage(round, item.detail._pageNo, function(list) {
                    if (list && list.length) {
                        item.detail._list = mergeArr(item.detail._list, list);
                    } else {
                        item.detail._endPage = true;
                    }

                    callback(item, list);
                });
            }
        },
        _detailPage: function(round, page, callback) {
            var _this = this;

            route({ key: 'historyDetail', params: { gameId: 1, gameRound: round, pageNo: page } }, function(response) { // @todo: config gameId
                if (!response && response.code !== 1) {
                    callback(false);
                    return;
                }

                var list = [];
                for (var i = 0, len = response.data.list.length; i < len; i++) {
                    list[i] = _this._getDetailItem(response.data.list[i]);
                }

                if (callback) {
                    callback(list);
                }
            });
        },
        _getDetailItem: function(item) {
            var params = {
                rank: item.rank,
                name: item.nickname,
                head: item.userHead,
                grade: item.gameScore,
                point: item.award,
                isLuck: item.lucky === 1 ? true : false,
                type: item.snatchType
            };

            if (item.mine === 1) {
                params.myself = true;
            }

            return params;
        },
        _init: function(callback) {
            var _this = this;

            this._get(function() {
                callback();
                delete _this._init;
            });
        }
    };

    var myRecords = {
        _pageNo: 1,
        _endPage: false,
        _collects: {
            list: []
        },
        _get: function(callback) {
            var _this = this;

            route({ key: 'myRecord', params: { pageNo: _this._pageNo } }, function(response) {
                if (!response && response.code !== 1) {
                    callback(false);
                    return;
                }

                var list = [];
                for (var i = 0, len = response.data.list.length; i < len; i++) {
                    list[i] = _this._getItem(response.data.list[i]);
                }

                if (!list.length) {
                    _this._endPage = true;
                } else {
                    _this._collects.list = mergeArr(_this._collects.list, list);
                }

                if (callback) {
                    callback(list);
                }
            });
        },
        _nextPage: function(callback) {
            this._pageNo++;
            this._get(callback);
        },
        _getItem: function(item) {
            return {
                round: item.gameRound,
                count: item.partNum,
                grade: item.gameScore,
                rank: item.rank,
                point: item.award,
                isLuck: item.lucky === 1 ? true : false
            };
        },
        _init: function(callback) {
            var _this = this;

            this._get(function() {
                callback();
                delete _this._init;
            });
        }
    };

    function getHead(item) {
        var head = item.head,
            isnull_head = !head || head === '';

        if (String(item.type) === _c.TYPES.app0013) {
            head = isnull_head ? (_c.TPL_PATH + 'images/head-none.png') : (_c.IMG_HOST_0013 + head);
        } else if (isnull_head) {
            head = _c.TPL_PATH + 'images/head.jpg';
        }

        return head;
    }

    function mergeArr() {
        return Array.prototype.concat.apply([], arguments);
    }

    function getEndTime(intime) { // 参数：毫秒
        return new Date().getTime() + intime;
    }

    return {
        personal: personal,
        thisRank: thisRank,
        prevRank: prevRank,
        history: history,
        myRecords: myRecords,
        getHead: getHead
    };
});
