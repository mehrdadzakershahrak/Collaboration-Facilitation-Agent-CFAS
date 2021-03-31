"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var TRADE_TIMEOUT = 45;
var ALERT_TIMEOUT = 3000;
var BASE_ROUTE_IMGS = '/view/v1/asset/';
var player_ids = ['A', 'B', 'C', 'D'];
var MISSION_CONDS = [0, 1, 2, 3];
var socket = io();
var vm = getSess();
var PLAYER_MAP = {
  'A': 0,
  'B': 1,
  'C': 2,
  'D': 3
};
var RESOURCE_NAME_MAP = {
  'food': 'Food',
  'water': 'Water',
  'medicine': 'Medicine',
  'supply': 'Construction Supply'
}; // TODO: clean me up - mappings should be direct from db

var PLAYER_FULLNAME_MAP = {
  'A': 'Alpha',
  'B': 'Bravo',
  'C': 'Charlie',
  'D': 'Delta',
  'Shelter': 'Shelter',
  'Distribution Center': 'Distribution Center',
  'Hospital': 'Hospital',
  'Bridge': 'Bridge'
};

function resetVm(isAdmin) {
  vm['gametime'] = vm['start_game_time'];
  vm['isGameActive'] = false;
  vm['activeTrades'] = isAdmin ? [false, false, false, false] : [false, false, false];
  vm['freeTradeIdxs'] = isAdmin ? [0, 1, 2, 3] : [0, 1, 2];
  vm['proposeTimer'] = TRADE_TIMEOUT;
  vm['proposeBtnTime'] = 0;
  vm['adminGameActive'] = false;
  vm['pAvail'] = [];
  vm['pDest'] = {};
}

function isCacheValid(vm) {
  return 'routeOrders' in vm;
}

function saveSess(vm) {
  return localStorage.setItem('vm', JSON.stringify(vm));
}

function getSess() {
  var vm = localStorage.getItem('vm');

  if (vm == null || vm.trim() == '') {
    vm = {};
  } else {
    vm = JSON.parse(vm);
  }

  return vm;
}

var rejected_offers = [];

var CreateGameWidget = /*#__PURE__*/function (_React$Component) {
  _inherits(CreateGameWidget, _React$Component);

  var _super = _createSuper(CreateGameWidget);

  function CreateGameWidget(props) {
    var _this;

    _classCallCheck(this, CreateGameWidget);

    _this = _super.call(this, props);
    _this.createGame = _this.createGame.bind(_assertThisInitialized(_this));
    _this.swapDashboard = props.swapDashboard;
    var pts = JSON.parse($('#player_templates').val());
    var ids = [];
    var i;

    for (i = 0; i < pts.length; i++) {
      var p = pts[i];

      if (!ids.includes(p.template_id)) {
        ids.push(p.template_id);
      }
    }

    _this.tableRowClasses = ['tr-template-1', 'tr-template-2', 'tr-template-3'];
    _this.state = {
      "ids": ids,
      "gameid": "Click Create Game",
      "player_ids": []
    };
    return _this;
  }

  _createClass(CreateGameWidget, [{
    key: "createGame",
    value: function createGame() {
      var self = this;
      var trades = $('#trades').val();
      socket.emit('create-new-game', {
        time: parseInt($("#time").val()),
        trades: trades,
        sel_player_template: $("#player_template_select option:selected").val(),
        condition_num: $("#condition_num option:selected").val()
      });
      socket.on('create-new-game', function (data) {
        var d = JSON.parse(data);
        self.setState({
          "ids": self.state['ids'],
          "gameid": d['gameid']
        });
      });
      return;
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      return /*#__PURE__*/React.createElement("div", {
        "class": "create_game_container",
        id: "create_game_container"
      }, /*#__PURE__*/React.createElement("h3", null, "Create New Mission"), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("div", {
        "class": "player_template_label"
      }, "Game template:"), /*#__PURE__*/React.createElement("select", {
        "class": "player_template_select",
        id: "player_template_select"
      }, /*#__PURE__*/React.createElement("option", {
        selected: true,
        disabled: true,
        hidden: true,
        value: "0"
      }, "Select Template:"), this.state["ids"].map(function (i) {
        return /*#__PURE__*/React.createElement("option", {
          value: i,
          "class": _this2.tableRowClasses[i - 1]
        }, "Template ", i);
      })), /*#__PURE__*/React.createElement("select", {
        "class": "player_template_select",
        id: "condition_num"
      }, /*#__PURE__*/React.createElement("option", {
        selected: true,
        disabled: true,
        hidden: true,
        value: "0"
      }, "Select Condition:"), MISSION_CONDS.map(function (i) {
        return /*#__PURE__*/React.createElement("option", {
          value: i,
          "class": "mission-cond"
        }, "Condition ", i);
      })), /*#__PURE__*/React.createElement("input", {
        type: "number",
        id: "time",
        name: "time",
        min: "0",
        step: "1",
        placeholder: "Please Enter Time in Seconds"
      }), /*#__PURE__*/React.createElement("input", {
        type: "hidden",
        id: "trades",
        name: "trades",
        placeholder: "Please Enter Total Number of allowable Trades",
        value: "100"
      }), /*#__PURE__*/React.createElement("button", {
        "class": "create_game_btn",
        onClick: this.createGame
      }, "Create Mission"), /*#__PURE__*/React.createElement("label", null, "New Mission ID: ", this.state["gameid"]));
    }
  }]);

  return CreateGameWidget;
}(React.Component);

var AvailPlayersWidget = /*#__PURE__*/function (_React$Component2) {
  _inherits(AvailPlayersWidget, _React$Component2);

  var _super2 = _createSuper(AvailPlayersWidget);

  function AvailPlayersWidget() {
    var _this3;

    _classCallCheck(this, AvailPlayersWidget);

    _this3 = _super2.call(this);
    _this3.tableRowCnt = -1;
    _this3.tableRowClasses = ['tr-template-1', 'tr-template-2', 'tr-template-3'];
    _this3.state = JSON.parse($('#player_templates').val());
    return _this3;
  }

  _createClass(AvailPlayersWidget, [{
    key: "render",
    value: function render() {
      var self = this;
      return /*#__PURE__*/React.createElement("div", {
        "class": "template_view"
      }, /*#__PURE__*/React.createElement("h3", null, "Available Player Templates"), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("table", {
        "class": "avail_player_table"
      }, /*#__PURE__*/React.createElement("tr", {
        "class": "table-header"
      }, /*#__PURE__*/React.createElement("th", null, "Name"), /*#__PURE__*/React.createElement("th", null, "Food"), /*#__PURE__*/React.createElement("th", null, "Water"), /*#__PURE__*/React.createElement("th", null, "Medical Supply"), /*#__PURE__*/React.createElement("th", null, "Construction")), this.state.map(function (item, i) {
        if (i % 8 == 0) {
          if (self.tableRowCnt > 3) {
            self.tableRowCnt = 0;
          } else {
            self.tableRowCnt += 1;
          }
        }

        return /*#__PURE__*/React.createElement("tr", {
          "class": self.tableRowClasses[self.tableRowCnt]
        }, /*#__PURE__*/React.createElement("td", null, PLAYER_FULLNAME_MAP[item.name]), /*#__PURE__*/React.createElement("td", null, item.food), /*#__PURE__*/React.createElement("td", null, item.water), /*#__PURE__*/React.createElement("td", null, item.medicine), /*#__PURE__*/React.createElement("td", null, item.supply));
      })));
    }
  }]);

  return AvailPlayersWidget;
}(React.Component);

var PlayerResAvail = /*#__PURE__*/function (_React$Component3) {
  _inherits(PlayerResAvail, _React$Component3);

  var _super3 = _createSuper(PlayerResAvail);

  function PlayerResAvail(prop) {
    var _this4;

    _classCallCheck(this, PlayerResAvail);

    _this4 = _super3.call(this, prop);
    var playerTemplate = JSON.parse(vm['player_templates']);
    _this4.playerId = vm['player_id'];
    _this4.pIdx = PLAYER_MAP[_this4.playerId];

    if (_this4.playerId == 'admin') {
      _this4.singleTemplate = false;
    } else {
      _this4.singleTemplate = true;
    }

    _this4.state = {};
    saveSess(vm);
    return _this4;
  }

  _createClass(PlayerResAvail, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var self = this;
      socket.on('trade-accept-resources-updt', function (data) {
        var d = JSON.parse(data);
        var cur_player_id = vm['player_id'];

        var updateRes = function updateRes(pId, offerPlayer) {
          for (var key in vm['pAvail'][pId]) {
            if (key == 'name') {
              continue;
            }

            vm['pAvail'][pId][key] = parseInt(vm['pAvail'][pId][key]);
          }

          var resKey = false;

          for (var key in vm['pAvail'][pId]) {
            if (key.toLowerCase().trim() === d['resource'].toLowerCase().trim()) {
              resKey = key;
            }
          }

          var keyVal = vm['pAvail'][pId][resKey];

          if (resKey !== false) {
            if (offerPlayer) {
              vm['pAvail'][pId][resKey] = keyVal - parseInt(d['offer_amount']);
            } else {
              vm['pAvail'][pId][resKey] = keyVal + parseInt(d['offer_amount']);
            }
          }

          saveSess(vm);
          self.setState(self.state);
        };

        if (cur_player_id === d['player_id_accepted']) {
          updateRes(PLAYER_MAP[cur_player_id], false);
        } else if (cur_player_id === d['player_id_offered']) {
          updateRes(PLAYER_MAP[cur_player_id], true);
        } else if (cur_player_id === 'admin') {
          updateRes(PLAYER_MAP[d['player_id_accepted']], false);
          updateRes(PLAYER_MAP[d['player_id_offered']], true);
        }
      });
    }
  }, {
    key: "render",
    value: function render() {
      var resourcesText = null;
      var self = this;
      var text = null;

      if (self.singleTemplate) {
        resourcesText = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
          "class": "sect-label"
        }, "These are the resources available to you"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
          "class": "rtile"
        }, /*#__PURE__*/React.createElement("div", {
          id: "supply_food"
        }, "Food: ", /*#__PURE__*/React.createElement("span", {
          id: "supply_food_val"
        }, vm['pAvail'][self.pIdx].food))), /*#__PURE__*/React.createElement("div", {
          "class": "rtile"
        }, /*#__PURE__*/React.createElement("div", {
          id: "supply_water"
        }, "Water: ", /*#__PURE__*/React.createElement("span", {
          id: "supply_water_val"
        }, vm['pAvail'][self.pIdx].water))), /*#__PURE__*/React.createElement("div", {
          "class": "rtile"
        }, /*#__PURE__*/React.createElement("div", {
          id: "supply_medicine"
        }, "Medicine: ", /*#__PURE__*/React.createElement("span", {
          id: "supply_medicine_val"
        }, vm['pAvail'][self.pIdx].medicine))), /*#__PURE__*/React.createElement("div", {
          "class": "rtile"
        }, /*#__PURE__*/React.createElement("div", {
          id: "supply_supply"
        }, "Construction: ", /*#__PURE__*/React.createElement("span", {
          id: "supply_supply_val"
        }, vm['pAvail'][self.pIdx].supply)))));
      } else {
        resourcesText = /*#__PURE__*/React.createElement("table", {
          "class": "avail_player_table"
        }, /*#__PURE__*/React.createElement("tr", {
          "class": "table-header"
        }, /*#__PURE__*/React.createElement("th", null, "Name"), /*#__PURE__*/React.createElement("th", null, "Food"), /*#__PURE__*/React.createElement("th", null, "Water"), /*#__PURE__*/React.createElement("th", null, "Medical Supply"), /*#__PURE__*/React.createElement("th", null, "Construction")), vm['pAvail'].map(function (item, i) {
          return /*#__PURE__*/React.createElement("tr", {
            "class": "tr-template-1"
          }, /*#__PURE__*/React.createElement("td", null, PLAYER_FULLNAME_MAP[item.name]), /*#__PURE__*/React.createElement("td", null, item.food), /*#__PURE__*/React.createElement("td", null, item.water), /*#__PURE__*/React.createElement("td", null, item.medicine), /*#__PURE__*/React.createElement("td", null, item.supply));
        }));
      }

      if (self.playerId == 'admin') {
        text = /*#__PURE__*/React.createElement("div", {
          "class": "grid-x grid-margin-x grid-margin-y"
        }, /*#__PURE__*/React.createElement("div", {
          "class": "resources medium-6 cell",
          id: "resources"
        }, resourcesText), /*#__PURE__*/React.createElement("div", {
          "class": "trucks medium-6 cell",
          id: "trucks"
        }, /*#__PURE__*/React.createElement("table", {
          "class": "tg"
        }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
          "class": "tg-1wig"
        }, "Destination"), /*#__PURE__*/React.createElement("th", {
          "class": "tg-1wig"
        }, "Food"), /*#__PURE__*/React.createElement("th", {
          "class": "tg-1wig"
        }, "Water"), /*#__PURE__*/React.createElement("th", {
          "class": "tg-1wig"
        }, "Medicine"), /*#__PURE__*/React.createElement("th", {
          "class": "tg-1wig"
        }, "Construction"))), /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
          "class": "tg-1wig"
        }, "Shelter"), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Shelter'].food), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Shelter'].water), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Shelter'].medicine), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Shelter'].supply)), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
          "class": "tg-1wig"
        }, "Distribution Center"), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Distribution Center'].food), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Distribution Center'].water), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Distribution Center'].medicine), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Distribution Center'].supply)), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
          "class": "tg-1wig"
        }, "Hospital"), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Hospital'].food), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Hospital'].water), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Hospital'].medicine), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Hospital'].supply)), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
          "class": "tg-1wig"
        }, "Bridge"), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Bridge'].food), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Bridge'].water), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Bridge'].medicine), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Bridge'].supply))))));
      } else {
        text = /*#__PURE__*/React.createElement("div", {
          "class": "grid-x grid-margin-x grid-margin-y"
        }, /*#__PURE__*/React.createElement("div", {
          "class": "resources medium-6 cell",
          id: "resources"
        }, resourcesText), /*#__PURE__*/React.createElement("div", {
          "class": "trucks medium-6 cell",
          id: "trucks"
        }, /*#__PURE__*/React.createElement("label", {
          "class": "dest-sect-label"
        }, "These are the approximate destinations requirements "), /*#__PURE__*/React.createElement("table", {
          "class": "tg"
        }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
          "class": "tg-1wig"
        }, "Destination"), /*#__PURE__*/React.createElement("th", {
          "class": "tg-1wig"
        }, "Food"), /*#__PURE__*/React.createElement("th", {
          "class": "tg-1wig"
        }, "Water"), /*#__PURE__*/React.createElement("th", {
          "class": "tg-1wig"
        }, "Medicine"), /*#__PURE__*/React.createElement("th", {
          "class": "tg-1wig"
        }, "Construction"))), /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
          "class": "tg-1wig"
        }, "Shelter"), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Shelter'].food_range), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Shelter'].water_range), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Shelter'].medicine_range), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Shelter'].supply_range)), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
          "class": "tg-1wig"
        }, "Distribution Center"), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Distribution Center'].food_range), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Distribution Center'].water_range), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Distribution Center'].medicine_range), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Distribution Center'].supply_range)), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
          "class": "tg-1wig"
        }, "Hospital"), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Hospital'].food_range), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Hospital'].water_range), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Hospital'].medicine_range), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Hospital'].supply_range)), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
          "class": "tg-1wig"
        }, "Bridge"), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Bridge'].food_range), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Bridge'].water_range), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Bridge'].medicine_range), /*#__PURE__*/React.createElement("td", {
          "class": "tg-baqh"
        }, vm['pDest']['Bridge'].supply_range))))));
      }

      return /*#__PURE__*/React.createElement("div", {
        "class": "resources-group large-6-up cell"
      }, text);
    }
  }]);

  return PlayerResAvail;
}(React.Component);

var PlayerTradeReq = /*#__PURE__*/function (_React$Component4) {
  _inherits(PlayerTradeReq, _React$Component4);

  var _super4 = _createSuper(PlayerTradeReq);

  function PlayerTradeReq() {
    var _this5;

    _classCallCheck(this, PlayerTradeReq);

    _this5 = _super4.call(this);
    _this5.proposeTrade = _this5.proposeTrade.bind(_assertThisInitialized(_this5));
    _this5.startProposeBtnTimer = _this5.startProposeBtnTimer.bind(_assertThisInitialized(_this5));
    _this5.gamealert = false;
    _this5.playerId = vm['player_id'];
    _this5.proposeBtnTimer = false;
    return _this5;
  }

  _createClass(PlayerTradeReq, [{
    key: "startProposeBtnTimer",
    value: function startProposeBtnTimer() {
      var self = this;
      self.proposeBtnTimer = setInterval(function () {
        if (vm['proposeBtnTime'] > 0) {
          vm['proposeBtnTime'] -= 1;
          saveSess(vm);
        } else {
          clearInterval(self.proposeBtnTimer);
          $('#trade_propose_btn').removeAttr('disabled');
          vm['proposeBtnTime'] = 0;
        }
      }, 1000);
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      var self = this;

      if (self.playerId == 'admin') {
        $('.trade-resources').css('visibility', 'hidden');
      }

      socket.on('trade-accept', function (data) {
        var d = JSON.parse(data);
        var cur_player_id = vm['player_id'];

        if (cur_player_id === d['player_id_offered']) {
          $('#game-alert-notify').text('Warehouse Manager ' + d['player_id_accepted'] + ' accepted your offer!');
          $('#trade_propose_btn').removeAttr('disabled');
          vm['proposeBtnTime'] = 0;
          clearInterval(self.proposeBtnTimer);
          self.gamealert = setInterval(function () {
            $('#game-alert-notify').text('');

            if (self.gamealert !== false) {
              clearInterval(self.gamealert);
              self.gamealert = false;
            }
          }, ALERT_TIMEOUT);
        }
      });
      socket.on('trade-already-taken', function (data) {
        var d = JSON.parse(data);
        var cur_player_id = vm['player_id'];

        if (cur_player_id === d['player_id_accepted']) {
          self.gamealert = setInterval(function () {
            $('#game-alert-notify').text('Trade already accepted by another Warehouse Manager!');

            if (self.gamealert !== false) {
              clearInterval(self.gamealert);
              self.gamealert = false;
            }
          }, ALERT_TIMEOUT);
        }
      });
      socket.on('propose-deny', function (data) {
        var d = JSON.parse(data);
        var cur_player_id = vm['player_id'];
        var offerFound = false;
        var c = 0;
        $('#trade_propose_btn').removeAttr('disabled');
        vm['proposeBtnTime'] = 0;
        clearInterval(self.proposeBtnTimer);

        for (; c < rejected_offers.length; c++) {
          if (rejected_offers[c] === d['trade_id']) {
            offerFound = True;
            break;
          }
        }

        if (!offerFound && cur_player_id === d['player_id_offered']) {
          rejected_offers.push(d['trade_id']);
          $('#game-alert-notify').text('All players rejected your offer!');
          self.gamealert = setInterval(function () {
            $('#game-alert-notify').text('');

            if (self.gamealert !== false) {
              clearInterval(self.gamealert);
              self.gamealert = false;
            }
          }, ALERT_TIMEOUT);
        }
      });

      if (vm['proposeBtnTime'] > 0) {
        $('#trade_propose_btn').attr('disabled', '');
        self.startProposeBtnTimer();
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this.gamealert !== false) {
        clearInterval(this.gamealert);
      }

      if (this.proposeBtnTimer !== false) {
        clearInterval(this.proposeBtnTimer);
      }
    }
  }, {
    key: "proposeTrade",
    value: function proposeTrade() {
      var self = this;
      var offer_amount = $('#offer_amount').val();
      var resource = $("#offer_select option:selected").val();
      var player_id_offered = vm['player_id'];
      var gameid = vm['gameid'];
      var availResAmount = parseInt($('#supply_' + resource + '_val').text());
      vm['proposeBtnTime'] = TRADE_TIMEOUT;
      self.startProposeBtnTimer();

      if (offer_amount <= 0) {
        $('#game-alert-notify').text('You must enter a positive number!');
      } else if (offer_amount > availResAmount) {
        $('#game-alert-notify').text('You do not have enough for this offer!');
      } else {
        $('#game-alert-notify').text('Your offer has been posted!');
        $('#trade_propose_btn').attr('disabled', '');
        socket.emit('propose-trade', {
          "offer_amount": offer_amount,
          "resource": resource,
          "gameid": gameid,
          "player_id_offered": player_id_offered,
          "trade_expire": new Date().valueOf() + TRADE_TIMEOUT
        });
      }

      self.gamealert = setInterval(function () {
        $('#game-alert-notify').text('');

        if (self.gamealert !== false) {
          clearInterval(self.gamealert);
          self.gamealert = false;
        }
      }, ALERT_TIMEOUT);
    }
  }, {
    key: "render",
    value: function render() {
      return /*#__PURE__*/React.createElement("div", {
        "class": "trade trade-resources large-6 medium-6 cell",
        id: "trade"
      }, /*#__PURE__*/React.createElement("h5", null, "Resources can be offered to other players to help them achieve their goals Offer the following:"), /*#__PURE__*/React.createElement("input", {
        "class": "offer_input",
        placeholder: "Make Offer",
        type: "number",
        id: "offer_amount"
      }), /*#__PURE__*/React.createElement("select", {
        id: "offer_select"
      }, /*#__PURE__*/React.createElement("option", {
        value: "food"
      }, "Food"), /*#__PURE__*/React.createElement("option", {
        value: "water"
      }, "Water"), /*#__PURE__*/React.createElement("option", {
        value: "medicine"
      }, "Medicine"), /*#__PURE__*/React.createElement("option", {
        value: "supply"
      }, "Construction")), /*#__PURE__*/React.createElement("button", {
        "class": "trade_propose_btn button",
        onClick: this.proposeTrade,
        id: "trade_propose_btn"
      }, "Propose Offer!"));
    }
  }]);

  return PlayerTradeReq;
}(React.Component);

var PlayerTradeAccept = /*#__PURE__*/function (_React$Component5) {
  _inherits(PlayerTradeAccept, _React$Component5);

  var _super5 = _createSuper(PlayerTradeAccept);

  function PlayerTradeAccept(props) {
    var _this6;

    _classCallCheck(this, PlayerTradeAccept);

    _this6 = _super5.call(this, props);
    _this6.acceptTrade = _this6.acceptTrade.bind(_assertThisInitialized(_this6));
    _this6.componentWillUnmount = _this6.componentWillUnmount.bind(_assertThisInitialized(_this6));
    _this6.playerId = vm['player_id'];
    _this6.state = {
      "activeTrades": vm['activeTrades'],
      "freeTradeIdxs": vm['freeTradeIdx'],
      "tradeIntervals": vm['player_id'] == 'admin' ? [false, false, false, false] : [false, false, false]
    };
    return _this6;
  }

  _createClass(PlayerTradeAccept, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var self = this;
      var playerId = vm['player_id'];
      var gameid = vm['gameid'];
      var tradeIntervals = this.state['tradeIntervals'];

      var tradeCntDown = function tradeCntDown(i) {
        tradeIntervals[i] = setInterval(function () {
          if (vm['activeTrades'][i].trade_cnt_down > 0) {
            vm['activeTrades'][i].trade_cnt_down -= 1;
            saveSess(vm);
            self.setState({
              "activeTrades": vm['activeTrades']
            });
          } else {
            socket.emit('propose-deny', {
              "gameid": gameid,
              "player_id_offered": vm['activeTrades'][i]['player_id_offered'],
              "offer_amount": vm['activeTrades'][i]['offer_amount'],
              "resource": vm['activeTrades'][i]['resource'],
              "trade_id": vm['activeTrades'][i]['trade_id'],
              "trade_expire": vm['activeTrades'][i]['trade_expire']
            });
            vm['activeTrades'][i] = false;
            clearInterval(tradeIntervals[i]);
            vm['freeTradeIdxs'].push(i);
            tradeIntervals[i] = false;
            self.setState({
              "activeTrades": vm['activeTrades']
            });
            saveSess(vm);
          }
        }, 1000);
      };

      var c = 0;

      for (; c < vm['activeTrades'].length; c++) {
        if (vm['activeTrades'][c]) {
          tradeCntDown(c);
        }
      }

      socket.on('propose-trade', function (data) {
        var d = JSON.parse(data);
        var gameid = vm['gameid'];
        var player_id_accepted = vm['player_id'];

        if (playerId === d['player_id_offered']) {
          return;
        }

        if (vm['freeTradeIdxs'].length > 0) {
          var i = vm['freeTradeIdxs'].shift();
          vm['activeTrades'][i] = {
            "resource": d['resource'],
            "offer_amount": d['offer_amount'],
            "player_id_offered": d['player_id_offered'],
            "trade_id": d['trade_id'],
            "trade_cnt_down": TRADE_TIMEOUT
          };
          tradeCntDown(i);
        }

        self.setState({
          "activeTrades": vm['activeTrades']
        });
        saveSess(vm);
      });
      socket.on('trade-accept-offer-updt', function (data) {
        var d = JSON.parse(data);
        var tradeIntervals = self.state.tradeIntervals;

        if (playerId === d['player_id_offered']) {
          return;
        }

        var c = 0;
        var idx = -1;

        for (; c < vm.activeTrades.length; c++) {
          if (vm.activeTrades[c].trade_id === d['trade_id']) {
            idx = c;
            break;
          }
        }

        if (idx >= 0) {
          vm.activeTrades[idx] = false;
          clearInterval(tradeIntervals[idx]);
          tradeIntervals[idx] = false;
          vm.freeTradeIdxs.push(idx);
          self.setState({
            "activeTrades": vm.activeTrades
          });
        }
      });
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      var c = 0;
      var self = this;
      var tradeIntervals = self.state['tradeIntervals'];

      for (; c < tradeIntervals.length; c++) {
        if (tradeIntervals !== false) {
          clearInterval(tradeIntervals[c]);
          tradeIntervals[c] = false;
        }
      }
    }
  }, {
    key: "acceptTrade",
    value: function acceptTrade(trade_idx) {
      var self = this;
      var gameid = vm['gameid'];
      var trade = self.state['activeTrades'][trade_idx];
      var player_id_accepted = vm['player_id'];
      socket.emit('trade-accept', {
        "gameid": gameid,
        "player_id_accepted": player_id_accepted,
        "player_id_offered": trade['player_id_offered'],
        "offer_amount": trade['offer_amount'],
        "resource": trade['resource'],
        "trade_id": trade['trade_id']
      });
    }
  }, {
    key: "render",
    value: function render() {
      var self = this;
      var text = null;

      if (self.playerId == 'admin') {
        text = self.state['activeTrades'].map(function (item, i) {
          return /*#__PURE__*/React.createElement("div", {
            key: i
          }, /*#__PURE__*/React.createElement("div", {
            "class": "otile"
          }, /*#__PURE__*/React.createElement("div", {
            id: "trade_offer_p" + i + 1
          }, !item ? "No offers at this time!" : "Warehouse " + item.player_id_offered + " offered " + item.offer_amount + " " + RESOURCE_NAME_MAP[item.resource.toLowerCase().trim()])), /*#__PURE__*/React.createElement("label", null), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("label", null, "Offer Remaining Time: "), /*#__PURE__*/React.createElement("label", null, item.trade_cnt_down)));
        });
      } else {
        text = self.state['activeTrades'].map(function (item, i) {
          return /*#__PURE__*/React.createElement("div", {
            key: i
          }, /*#__PURE__*/React.createElement("div", {
            "class": "otile"
          }, /*#__PURE__*/React.createElement("div", {
            id: "trade_offer_p" + i + 1
          }, !item ? "No offers at this time!" : "Warehouse " + item.player_id_offered + " offered " + item.offer_amount + " " + RESOURCE_NAME_MAP[item.resource.toLowerCase().trim()])), /*#__PURE__*/React.createElement("button", {
            "class": "trade_accept_button button",
            onClick: function onClick(e) {
              return self.acceptTrade(i);
            }
          }, "Accept"), /*#__PURE__*/React.createElement("label", null), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("label", null, "Offer Remaining Time: "), /*#__PURE__*/React.createElement("label", null, item.trade_cnt_down)));
        });
      }

      return /*#__PURE__*/React.createElement("div", {
        "class": "trade_proposals large-6 cell",
        id: "trade_proposals"
      }, /*#__PURE__*/React.createElement("label", null, "Offers from other players: "), /*#__PURE__*/React.createElement("br", null), text);
    }
  }]);

  return PlayerTradeAccept;
}(React.Component);

var PlayerInfo = /*#__PURE__*/function (_React$Component6) {
  _inherits(PlayerInfo, _React$Component6);

  var _super6 = _createSuper(PlayerInfo);

  function PlayerInfo() {
    _classCallCheck(this, PlayerInfo);

    return _super6.apply(this, arguments);
  }

  _createClass(PlayerInfo, [{
    key: "render",
    value: function render() {
      return /*#__PURE__*/React.createElement("div", {
        "class": "game_info"
      }, /*#__PURE__*/React.createElement("div", {
        "class": "information",
        id: "information"
      }));
    }
  }]);

  return PlayerInfo;
}(React.Component);

var PlayerGoalSelect = /*#__PURE__*/function (_React$Component7) {
  _inherits(PlayerGoalSelect, _React$Component7);

  var _super7 = _createSuper(PlayerGoalSelect);

  function PlayerGoalSelect() {
    var _this7;

    _classCallCheck(this, PlayerGoalSelect);

    _this7 = _super7.call(this);
    _this7.proposeResources = _this7.proposeResources.bind(_assertThisInitialized(_this7));
    _this7.playerId = vm['player_id'];
    return _this7;
  }

  _createClass(PlayerGoalSelect, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var c = 1;
      var self = this;

      if (self.playerId == 'admin') {
        for (; c < 5; c++) {
          $('#player-' + c + '-pg-choices').removeClass('disabled');
        }
      }

      var player_id_map = {
        "A": "1",
        "B": "2",
        "C": "3",
        "D": "4"
      };
      var cur_player_id = vm['player_id'];
      socket.on('propose-resource', function (data) {
        var d = JSON.parse(data);
        var player_id = d['player_id'];
        var choices = d['res_choices'];

        switch (player_id) {
          case 'A':
            var priorities = $('#priority-sel li');
            var c = 0;

            for (; c < 4; c++) {
              $(priorities[c]).text(choices[c]);
            }

            break;

          case 'B':
            var c = 0;

            for (; c < 4; c++) {
              $("#dest" + (c + 1) + "-sel").val(choices[c]);
            }

            break;

          case 'C':
            var c = 0;

            for (; c < 4; c++) {
              $("#truck" + (c + 1) + "-sel").val(choices[c]);
            }

            break;

          case 'D':
            var c = 0;

            for (; c < 4; c++) {
              $("#route" + (c + 1) + "-sel").val(choices[c]);
            }

            break;
        }
      });

      if (cur_player_id === "A") {
        $(function () {
          $("#priority-sel").sortable();
          $("#priority-sel").disableSelection();
          $(".priority-sel-item").css("cursor", "pointer");
          $(".priority-sel-item").css("border", "2pt solid #1779ba");
          $(".priority-sel-item").css("background-color", "white");
        });
      }

      $('#player-' + player_id_map[cur_player_id] + '-pg-choices').removeClass('disabled');
      $('#player-' + player_id_map[cur_player_id] + '-pg-choices select').removeAttr('disabled');
    }
  }, {
    key: "proposeResources",
    value: function proposeResources() {
      var player_id = vm['player_id'];
      var upid = vm['upid'];
      var gameid = vm['gameid'];
      var choices = [];

      switch (player_id) {
        case 'A':
          var c = 0;

          for (; c < 4; c++) {
            choices.push($($('#priority-sel li')[c]).text());
          }

          break;

        case 'B':
          var c = 1;

          for (; c <= 4; c++) {
            choices.push($("#dest" + c + "-sel option:selected").val());
          }

          break;

        case 'C':
          var c = 1;

          for (; c <= 4; c++) {
            choices.push($("#truck" + c + "-sel option:selected").val());
          }

          break;

        case 'D':
          var c = 1;

          for (; c <= 4; c++) {
            choices.push($("#route" + c + "-sel option:selected").val());
          }

          break;
      }

      var data = {
        "player_id": player_id,
        "choices": choices
      };
      var c = 0;

      for (; c < choices.length; c++) {
        if (parseInt(choices[c]) === 0) {
          return;
        }
      }

      socket.emit('propose-resource', {
        "player_id": player_id,
        "upid": upid,
        "choices": choices,
        "gameid": gameid
      });
    }
  }, {
    key: "startGame",
    value: function startGame() {
      var gameid = vm['gameid'];
      $('#start_game_btn').attr('disabled', '');
      socket.emit('start-game', {
        "gameid": gameid
      });
    }
  }, {
    key: "stopGame",
    value: function stopGame() {
      var gameid = vm['gameid'];
      $('#start_game_btn').removeAttr('disabled');
      socket.emit('stop-game', {
        "gameid": gameid,
        "gametime": vm['gametime']
      });
    }
  }, {
    key: "render",
    value: function render() {
      var _this8 = this;

      return /*#__PURE__*/React.createElement("div", {
        "class": "resource-goals large-up-6 cell",
        id: "resource-goals"
      }, /*#__PURE__*/React.createElement("div", {
        "class": "grid-x grid-margin-x grid-margin-y"
      }, /*#__PURE__*/React.createElement("div", {
        id: "player-1-pg-choices",
        "class": "trade medium-3 cell disabled"
      }, /*#__PURE__*/React.createElement("label", null, "Please Select the Priorities"), /*#__PURE__*/React.createElement("ol", {
        id: "priority-sel"
      }, /*#__PURE__*/React.createElement("li", {
        "class": "priority-sel-item ui-state-default"
      }, /*#__PURE__*/React.createElement("span", {
        "class": "ui-icon ui-icon-arrowthick-2-n-s"
      }), "Shelter"), /*#__PURE__*/React.createElement("li", {
        "class": "priority-sel-item ui-state-default"
      }, /*#__PURE__*/React.createElement("span", {
        "class": "ui-icon ui-icon-arrowthick-2-n-s"
      }), "Distribution Center"), /*#__PURE__*/React.createElement("li", {
        "class": "priority-sel-item ui-state-default"
      }, /*#__PURE__*/React.createElement("span", {
        "class": "ui-icon ui-icon-arrowthick-2-n-s"
      }), "Hospital"), /*#__PURE__*/React.createElement("li", {
        "class": "priority-sel-item ui-state-default"
      }, /*#__PURE__*/React.createElement("span", {
        "class": "ui-icon ui-icon-arrowthick-2-n-s"
      }), "Bridge"))), /*#__PURE__*/React.createElement("div", {
        id: "player-2-pg-choices",
        "class": "trade medium-3 cell disabled"
      }, /*#__PURE__*/React.createElement("label", null, "Please Assign Destinations"), /*#__PURE__*/React.createElement("label", {
        "for": "dest1-sel"
      }, "Shelter"), /*#__PURE__*/React.createElement("select", {
        id: "dest1-sel",
        "class": "dest1-sel player-sel",
        disabled: true
      }, /*#__PURE__*/React.createElement("option", {
        selected: true,
        disabled: true,
        hidden: true,
        value: "0"
      }, "Choose Warehouse:"), /*#__PURE__*/React.createElement("option", {
        value: "1"
      }, "Alpha"), /*#__PURE__*/React.createElement("option", {
        value: "2"
      }, "Bravo"), /*#__PURE__*/React.createElement("option", {
        value: "3"
      }, "Charlie"), /*#__PURE__*/React.createElement("option", {
        value: "4"
      }, "Delta")), /*#__PURE__*/React.createElement("label", {
        "for": "dest2-sel"
      }, "Center"), /*#__PURE__*/React.createElement("select", {
        id: "dest2-sel",
        "class": "dest2-sel player-sel",
        disabled: true
      }, /*#__PURE__*/React.createElement("option", {
        selected: true,
        disabled: true,
        hidden: true,
        value: "0"
      }, "Choose Warehouse:"), /*#__PURE__*/React.createElement("option", {
        value: "1"
      }, "Alpha"), /*#__PURE__*/React.createElement("option", {
        value: "2"
      }, "Bravo"), /*#__PURE__*/React.createElement("option", {
        value: "3"
      }, "Charlie"), /*#__PURE__*/React.createElement("option", {
        value: "4"
      }, "Delta")), /*#__PURE__*/React.createElement("label", {
        "for": "dest3-sel"
      }, "Hospital"), /*#__PURE__*/React.createElement("select", {
        id: "dest3-sel",
        "class": "dest3-sel player-sel",
        disabled: true
      }, /*#__PURE__*/React.createElement("option", {
        selected: true,
        disabled: true,
        hidden: true,
        value: "0"
      }, "Choose Warehouse:"), /*#__PURE__*/React.createElement("option", {
        value: "1"
      }, "Alpha"), /*#__PURE__*/React.createElement("option", {
        value: "2"
      }, "Bravo"), /*#__PURE__*/React.createElement("option", {
        value: "3"
      }, "Charlie"), /*#__PURE__*/React.createElement("option", {
        value: "4"
      }, "Delta")), /*#__PURE__*/React.createElement("label", {
        "for": "dest4-sel"
      }, "Bridge"), /*#__PURE__*/React.createElement("select", {
        id: "dest4-sel",
        "class": "dest4-sel player-sel",
        disabled: true
      }, /*#__PURE__*/React.createElement("option", {
        selected: true,
        disabled: true,
        hidden: true,
        value: "0"
      }, "Choose Warehouse:"), /*#__PURE__*/React.createElement("option", {
        value: "1"
      }, "Alpha"), /*#__PURE__*/React.createElement("option", {
        value: "2"
      }, "Bravo"), /*#__PURE__*/React.createElement("option", {
        value: "3"
      }, "Charlie"), /*#__PURE__*/React.createElement("option", {
        value: "4"
      }, "Delta"))), /*#__PURE__*/React.createElement("div", {
        id: "player-3-pg-choices",
        "class": "trade medium-3 cell disabled"
      }, /*#__PURE__*/React.createElement("label", null, "Please Select the Truck"), /*#__PURE__*/React.createElement("label", {
        "for": "truck1-sel"
      }, "Truck 1"), /*#__PURE__*/React.createElement("select", {
        id: "truck1-sel",
        "class": "truck1-sel player-sel",
        disabled: true
      }, /*#__PURE__*/React.createElement("option", {
        selected: true,
        disabled: true,
        hidden: true,
        value: "0"
      }, "Choose Warehouse:"), /*#__PURE__*/React.createElement("option", {
        value: "1"
      }, "Alpha"), /*#__PURE__*/React.createElement("option", {
        value: "2"
      }, "Bravo"), /*#__PURE__*/React.createElement("option", {
        value: "3"
      }, "Charlie"), /*#__PURE__*/React.createElement("option", {
        value: "4"
      }, "Delta")), /*#__PURE__*/React.createElement("label", {
        "for": "truck2-sel"
      }, "Truck 2"), /*#__PURE__*/React.createElement("select", {
        id: "truck2-sel",
        "class": "truck2-sel player-sel",
        disabled: true
      }, /*#__PURE__*/React.createElement("option", {
        selected: true,
        disabled: true,
        hidden: true,
        value: "0"
      }, "Choose Warehouse:"), /*#__PURE__*/React.createElement("option", {
        value: "1"
      }, "Alpha"), /*#__PURE__*/React.createElement("option", {
        value: "2"
      }, "Bravo"), /*#__PURE__*/React.createElement("option", {
        value: "3"
      }, "Charlie"), /*#__PURE__*/React.createElement("option", {
        value: "4"
      }, "Delta")), /*#__PURE__*/React.createElement("label", {
        "for": "truck3-sel"
      }, "Truck 3"), /*#__PURE__*/React.createElement("select", {
        id: "truck3-sel",
        "class": "truck3-sel player-sel",
        disabled: true
      }, /*#__PURE__*/React.createElement("option", {
        selected: true,
        disabled: true,
        hidden: true,
        value: "0"
      }, "Choose Warehouse:"), /*#__PURE__*/React.createElement("option", {
        value: "1"
      }, "Alpha"), /*#__PURE__*/React.createElement("option", {
        value: "2"
      }, "Bravo"), /*#__PURE__*/React.createElement("option", {
        value: "3"
      }, "Charlie"), /*#__PURE__*/React.createElement("option", {
        value: "4"
      }, "Delta")), /*#__PURE__*/React.createElement("label", {
        "for": "truck4-sel"
      }, "Truck 4"), /*#__PURE__*/React.createElement("select", {
        id: "truck4-sel",
        "class": "truck4-sel player-sel",
        disabled: true
      }, /*#__PURE__*/React.createElement("option", {
        selected: true,
        disabled: true,
        hidden: true,
        value: "0"
      }, "Choose Warehouse:"), /*#__PURE__*/React.createElement("option", {
        value: "1"
      }, "Alpha"), /*#__PURE__*/React.createElement("option", {
        value: "2"
      }, "Bravo"), /*#__PURE__*/React.createElement("option", {
        value: "3"
      }, "Charlie"), /*#__PURE__*/React.createElement("option", {
        value: "4"
      }, "Delta"))), /*#__PURE__*/React.createElement("div", {
        id: "player-4-pg-choices",
        "class": "trade medium-3 cell disabled"
      }, /*#__PURE__*/React.createElement("label", null, "Please Select the Route"), /*#__PURE__*/React.createElement("label", {
        "for": "route1-sel"
      }, "Alpha"), /*#__PURE__*/React.createElement("select", {
        id: "route1-sel",
        "class": "route1-sel player-sel",
        disabled: true
      }, /*#__PURE__*/React.createElement("option", {
        selected: true,
        disabled: true,
        hidden: true,
        value: "0"
      }, "Choose Route:"), /*#__PURE__*/React.createElement("option", {
        value: "1"
      }, "Route 1"), /*#__PURE__*/React.createElement("option", {
        value: "2"
      }, "Route 2"), /*#__PURE__*/React.createElement("option", {
        value: "3"
      }, "Route 3"), /*#__PURE__*/React.createElement("option", {
        value: "4"
      }, "Route 4")), /*#__PURE__*/React.createElement("label", {
        "for": "route2-sel"
      }, "Bravo"), /*#__PURE__*/React.createElement("select", {
        id: "route2-sel",
        "class": "route2-sel player-sel",
        disabled: true
      }, /*#__PURE__*/React.createElement("option", {
        selected: true,
        disabled: true,
        hidden: true,
        value: "0"
      }, "Choose Route:"), /*#__PURE__*/React.createElement("option", {
        value: "1"
      }, "Route 1"), /*#__PURE__*/React.createElement("option", {
        value: "2"
      }, "Route 2"), /*#__PURE__*/React.createElement("option", {
        value: "3"
      }, "Route 3"), /*#__PURE__*/React.createElement("option", {
        value: "4"
      }, "Route 4")), /*#__PURE__*/React.createElement("label", {
        "for": "route3-sel"
      }, "Charlie"), /*#__PURE__*/React.createElement("select", {
        id: "route3-sel",
        "class": "route3-sel player-sel",
        disabled: true
      }, /*#__PURE__*/React.createElement("option", {
        selected: true,
        disabled: true,
        hidden: true,
        value: "0"
      }, "Choose Route:"), /*#__PURE__*/React.createElement("option", {
        value: "1"
      }, "Route 1"), /*#__PURE__*/React.createElement("option", {
        value: "2"
      }, "Route 2"), /*#__PURE__*/React.createElement("option", {
        value: "3"
      }, "Route 3"), /*#__PURE__*/React.createElement("option", {
        value: "4"
      }, "Route 4")), /*#__PURE__*/React.createElement("label", {
        "for": "route4-sel"
      }, "Delta"), /*#__PURE__*/React.createElement("select", {
        id: "route4-sel",
        "class": "route4-sel player-sel",
        disabled: true
      }, /*#__PURE__*/React.createElement("option", {
        selected: true,
        disabled: true,
        hidden: true,
        value: "0"
      }, "Choose Route:"), /*#__PURE__*/React.createElement("option", {
        value: "1"
      }, "Route 1"), /*#__PURE__*/React.createElement("option", {
        value: "2"
      }, "Route 2"), /*#__PURE__*/React.createElement("option", {
        value: "3"
      }, "Route 3"), /*#__PURE__*/React.createElement("option", {
        value: "4"
      }, "Route 4")))), /*#__PURE__*/React.createElement("div", {
        "class": "grid-x grid-margin-x grid-margin-y"
      }, /*#__PURE__*/React.createElement("div", {
        "class": "resource_sect medium-up-6 cell"
      }, function () {
        switch (_this8.playerId) {
          case "admin":
            return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
              "class": "resource_propose button",
              onClick: _this8.startGame,
              id: "start_game_btn"
            }, "Start Mission"), /*#__PURE__*/React.createElement("button", {
              "class": "resource_propose button",
              onClick: _this8.stopGame,
              id: "stop_game_btn"
            }, "End Mission"));

          default:
            return /*#__PURE__*/React.createElement("button", {
              "class": "resource_propose button",
              onClick: _this8.proposeResources,
              id: "resource_propose_btn"
            }, "Propose!");
        }
      }())));
    }
  }]);

  return PlayerGoalSelect;
}(React.Component);

var PlayerTimer = /*#__PURE__*/function (_React$Component8) {
  _inherits(PlayerTimer, _React$Component8);

  var _super8 = _createSuper(PlayerTimer);

  function PlayerTimer(props) {
    var _this9;

    _classCallCheck(this, PlayerTimer);

    _this9 = _super8.call(this, props);
    _this9.gamealert = false;
    _this9.time_tracker = new Date();
    _this9.state = {
      "gametime": vm['start_game_time'],
      "game-start": '',
      "showScore": false,
      'score': 0
    };
    return _this9;
  }

  _createClass(PlayerTimer, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var self = this;

      var startTimer = function startTimer() {
        self.gameinterval = setInterval(function () {
          if (vm['gametime'] > 0) {
            vm['gametime'] = vm['gametime_end'] - Math.floor(new Date().getTime() / 1000.0);
            saveSess(vm);
            self.setState({
              "gametime": vm['gametime']
            });
          } else {
            clearInterval(self.gameinterval);
            self.gameinterval = false;
            self.gamealert = setInterval(function () {
              if (self.gamealert !== false) {
                clearInterval(self.gamealert);
                self.gamealert = false;
              }
            }, ALERT_TIMEOUT);
          }
        }, 1000);
      };

      socket.on('start-game', function (data) {
        var d = JSON.parse(data);
        var gamestart = null;
        vm['adminGameActive'] = true;
        saveSess(vm);
        vm['gametime_end'] = d.gametime_end;
        self.setState({
          'game-state': 'start',
          'showScore': false,
          'score': 0,
          'gametime_end': vm['gametime_end']
        });
        gamestart = setInterval(function () {
          clearInterval(gamestart);
          self.setState({
            'game-state': ''
          });
        }, ALERT_TIMEOUT);
        startTimer();
      });
      socket.on('stop-game', function (data) {
        var gametime = self.state.gametime;
        var min = gametime / 60;
        vm['adminGameActive'] = false;
        vm['gametime'] = vm['start_game_time'];
        self.setState({
          "game-state": "end"
        });
        vm['gametime_end'] = null;
        saveSess(vm);
        clearInterval(self.gameinterval);
        self.gameinterval = false;
        self.gamealert = setInterval(function () {
          if (self.gamealert !== false) {
            clearInterval(self.gamealert);
            self.gamealert = false;
          }

          self.setState({
            'game-state': '',
            'showScore': true,
            'score': (vm['start_game_time'] / 60 + min) * 100
          });
        }, ALERT_TIMEOUT);
      });

      if (vm['adminGameActive']) {
        startTimer();
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this.gameinterval !== false) {
        clearInterval(this.gameinterval);
        this.gameinterval = false;
      }

      if (this.gamealert !== false) {
        clearInterval(this.gamealert);
        this.gamealert = false;
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this10 = this;

      return /*#__PURE__*/React.createElement("div", {
        "class": "playertimer large-6 cell"
      }, function () {
        if (_this10.state['showScore'] == true) {
          return /*#__PURE__*/React.createElement("h3", {
            "class": "player-timer-label"
          }, "Score: ", _this10.state.score.toFixed(2));
        }
      }(), /*#__PURE__*/React.createElement("h3", {
        "class": "player-timer-label"
      }, "Time Left in Mission: ", /*#__PURE__*/React.createElement("br", null), function () {
        var minutes = Math.floor(_this10.state.gametime / 60);
        var sec = _this10.state.gametime - minutes * 60;
        return ' ' + minutes + ' Minutes, ' + sec + ' Seconds';
      }()), function () {
        switch (_this10.state['game-state']) {
          case "start":
            return /*#__PURE__*/React.createElement("h3", {
              "class": "player-timer-label"
            }, "Mission Started!");

          case "end":
            return /*#__PURE__*/React.createElement("h3", {
              "class": "player-timer-label"
            }, "Mission Ended");
        }
      }(), /*#__PURE__*/React.createElement("h3", {
        id: "game-alert-notify"
      }));
    }
  }]);

  return PlayerTimer;
}(React.Component);

var PlayerLog = /*#__PURE__*/function (_React$Component9) {
  _inherits(PlayerLog, _React$Component9);

  var _super9 = _createSuper(PlayerLog);

  function PlayerLog() {
    _classCallCheck(this, PlayerLog);

    return _super9.apply(this, arguments);
  }

  _createClass(PlayerLog, [{
    key: "render",
    value: function render() {
      return /*#__PURE__*/React.createElement("div", {
        "class": "log large-up-6 cell"
      }, "Event log: ", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("textarea", {
        "class": "log_text",
        id: "log_text",
        disabled: true
      }));
    }
  }]);

  return PlayerLog;
}(React.Component);

var PlayerDashboard = /*#__PURE__*/function (_React$Component10) {
  _inherits(PlayerDashboard, _React$Component10);

  var _super10 = _createSuper(PlayerDashboard);

  function PlayerDashboard(props) {
    var _this11;

    _classCallCheck(this, PlayerDashboard);

    _this11 = _super10.call(this, props);
    var warehouseMap = {
      'A': 'Alpha',
      'B': 'Bravo',
      'C': 'Charlie',
      'D': 'Delta'
    };
    _this11.logout = _this11.logout.bind(_assertThisInitialized(_this11));
    _this11.playerId = vm['player_id'];
    _this11.warehouse = warehouseMap[_this11.playerId];
    _this11.state = {
      "is_admin": vm['is_admin'],
      "gametime": vm['start_game_time']
    };
    return _this11;
  }

  _createClass(PlayerDashboard, [{
    key: "logout",
    value: function logout() {
      vm['isGameActive'] = false;
      saveSess(vm);
      window.location.reload();
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      $("#tabs").tabs();
    }
  }, {
    key: "render",
    value: function render() {
      var _this12 = this;

      return /*#__PURE__*/React.createElement("div", _defineProperty({
        id: "tabs",
        "class": "main-content"
      }, "class", "content grid-container"), /*#__PURE__*/React.createElement("ol", {
        id: "maindash-buttons"
      }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
        href: "#pdashboard",
        "class": "button"
      }, "Dashboard")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
        href: "#pmap1",
        "class": "button"
      }, "Route 1")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
        href: "#pmap2",
        "class": "button"
      }, "Route 2")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
        href: "#pmap3",
        "class": "button"
      }, "Route 3")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
        href: "#pmap4",
        "class": "button"
      }, "Route 4")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
        href: "#pquest1",
        "class": "button"
      }, "Questionaire 1")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
        href: "#pquest2",
        "class": "button"
      }, "Questionaire 2")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("h5", {
        "class": "dash-title"
      }, "Warehouse ", this.warehouse)), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("h5", {
        "class": "dash-title game-id-title"
      }, "Mission ID ", vm['gameid'])), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("h5", {
        id: "dash-logout-btn",
        "class": "button",
        onClick: this.logout
      }, "Logout"))), /*#__PURE__*/React.createElement("div", {
        id: "pdashboard"
      }, /*#__PURE__*/React.createElement("div", {
        "class": "grid-x grid-margin-x"
      }, /*#__PURE__*/React.createElement(PlayerGoalSelect, null)), /*#__PURE__*/React.createElement("div", {
        "class": "grid-x grid-margin-x"
      }, /*#__PURE__*/React.createElement(PlayerResAvail, null)), /*#__PURE__*/React.createElement("div", {
        "class": "grid-x grid-margin-x"
      }, /*#__PURE__*/React.createElement("div", {
        "class": "medium-6 cell"
      }, /*#__PURE__*/React.createElement("div", {
        "class": "grid-y grid-margin-y"
      }, /*#__PURE__*/React.createElement("div", {
        "class": "medium-6 cell"
      }, /*#__PURE__*/React.createElement(PlayerTradeReq, null)), /*#__PURE__*/React.createElement("div", {
        "class": "medium-6 cell"
      }, /*#__PURE__*/React.createElement(PlayerTimer, null)))), /*#__PURE__*/React.createElement(PlayerTradeAccept, null)), /*#__PURE__*/React.createElement("div", {
        "class": "grid-x grid-margin-x"
      }, function () {
        switch (_this12.state['is_admin']) {
          case "admin":
            return /*#__PURE__*/React.createElement(PlayerLog, null);

          case "":
            return "";
        }
      }())), vm["routeOrders"].map(function (item, i) {
        return /*#__PURE__*/React.createElement("div", {
          id: "pmap" + (i + 1)
        }, /*#__PURE__*/React.createElement("img", {
          src: BASE_ROUTE_IMGS + 'route' + item + '.jpg',
          height: "770",
          width: "1024"
        }));
      }), /*#__PURE__*/React.createElement("div", {
        id: "pquest1"
      }, "Questionaire 1 HERE"), /*#__PURE__*/React.createElement("div", {
        id: "pquest2"
      }, "Questionaire 2 HERE"));
    }
  }]);

  return PlayerDashboard;
}(React.Component);

var GameSetupDashboard = /*#__PURE__*/function (_React$Component11) {
  _inherits(GameSetupDashboard, _React$Component11);

  var _super11 = _createSuper(GameSetupDashboard);

  function GameSetupDashboard(props) {
    var _this13;

    _classCallCheck(this, GameSetupDashboard);

    _this13 = _super11.call(this, props);
    _this13.swapDashboard = props.swapDashboard;
    return _this13;
  }

  _createClass(GameSetupDashboard, [{
    key: "render",
    value: function render() {
      return /*#__PURE__*/React.createElement("div", {
        id: "main-content",
        "class": "content grid-container"
      }, /*#__PURE__*/React.createElement("div", {
        "class": "grid-x grid-padding-x"
      }, /*#__PURE__*/React.createElement("div", {
        "class": "medium-4 medium-4 cell"
      }, /*#__PURE__*/React.createElement(CreateGameWidget, {
        swapDashboard: this.swapDashboard
      })), /*#__PURE__*/React.createElement("div", {
        "class": "medium-4 medium-4 cell"
      }, /*#__PURE__*/React.createElement(AvailPlayersWidget, null))));
    }
  }]);

  return GameSetupDashboard;
}(React.Component);

var PlayerLogin = /*#__PURE__*/function (_React$Component12) {
  _inherits(PlayerLogin, _React$Component12);

  var _super12 = _createSuper(PlayerLogin);

  function PlayerLogin(props) {
    var _this14;

    _classCallCheck(this, PlayerLogin);

    _this14 = _super12.call(this, props);
    _this14.switchDashboard = props.switchDashboard;
    _this14.joinGame = _this14.joinGame.bind(_assertThisInitialized(_this14));
    return _this14;
  }

  _createClass(PlayerLogin, [{
    key: "joinGame",
    value: function joinGame(e, gameid) {
      var self = this;

      if (e) {
        e.preventDefault();
      }

      socket.on('join-game', function (data) {
        var d = JSON.parse(data);
        var player_templates = d['player_template'];
        resetVm(false);
        vm['is_admin'] = false;
        vm['isGameActive'] = true;
        vm['player_templates'] = JSON.stringify(player_templates);
        vm['player_id'] = player_ids[d['pid']];
        vm['gameid'] = gameid;
        vm['upid'] = d['upid'];
        vm['trades'] = [];
        vm['gametime'] = d['start_game_time'];
        vm['start_game_time'] = d['start_game_time'];
        vm['routeOrders'] = d['routeOrders'];
        var c = 0;

        for (; c < player_templates.length; c++) {
          var t = player_templates[c];

          if (t.dest_need == "0") {
            vm['pAvail'].push(t);
          } else {
            if (t.name == 'Distribution Center' || t.name == 'Hospital' || t.name == 'Bridge' || t.name == 'Shelter') {
              vm['pDest'][t.name] = t;
            }
          }
        }

        var c = 0;

        for (; c < vm['pAvail'].length; c++) {
          for (var key in vm['pAvail'][c]) {
            if (key == 'name') {
              continue;
            }

            vm['pAvail'][c][key] = parseInt(vm['pAvail'][c][key]);
          }
        }

        saveSess(vm);
        self.switchDashboard('playerdashboard');
      });
      socket.emit('join-game', {
        "gameid": gameid,
        "upid": vm['upid']
      });
    }
  }, {
    key: "render",
    value: function render() {
      var _this15 = this;

      return /*#__PURE__*/React.createElement("div", {
        "class": "grid-x grid-padding-x"
      }, /*#__PURE__*/React.createElement("div", {
        "class": "medium-4 medium-4 cell"
      }, /*#__PURE__*/React.createElement("label", null, "Mission ID:"), /*#__PURE__*/React.createElement("input", {
        type: "text",
        name: "gameid-login",
        id: "gameid-login",
        placeholder: "Enter Mission ID"
      }), /*#__PURE__*/React.createElement("button", {
        "class": "create_game_btn",
        onClick: function onClick(e) {
          return _this15.joinGame(e, $('#gameid-login').val());
        }
      }, "Join Mission")));
    }
  }]);

  return PlayerLogin;
}(React.Component);

var AdminLogin = /*#__PURE__*/function (_React$Component13) {
  _inherits(AdminLogin, _React$Component13);

  var _super13 = _createSuper(AdminLogin);

  function AdminLogin(props) {
    var _this16;

    _classCallCheck(this, AdminLogin);

    _this16 = _super13.call(this, props);
    _this16.switchDashboard = props.switchDashboard;
    _this16.joinGame = _this16.joinGame.bind(_assertThisInitialized(_this16));
    return _this16;
  }

  _createClass(AdminLogin, [{
    key: "joinGame",
    value: function joinGame(e) {
      var self = this;
      e.preventDefault();
      var gameid = $('#gameid-login').val();
      socket.on('join-game', function (data) {
        var d = JSON.parse(data);
        var player_templates = d['player_template'];
        resetVm(true);
        vm['gameid'] = d['gameid'];
        vm['isGameActive'] = true;
        vm['player_templates'] = JSON.stringify(d['player_template']);
        vm['player_id'] = 'admin';
        vm['is_admin'] = true;
        vm['routeOrders'] = d['routeOrders'];
        var c = 0;

        for (; c < player_templates.length; c++) {
          var t = player_templates[c];

          if (t.dest_need == "0") {
            vm['pAvail'].push(t);
          } else {
            if (t.name == 'Distribution Center' || t.name == 'Hospital' || t.name == 'Bridge' || t.name == 'Shelter') {
              vm['pDest'][t.name] = t;
            }
          }
        }

        var c = 0;

        for (; c < vm['pAvail'].length; c++) {
          for (var key in vm['pAvail'][c]) {
            if (key == 'name') {
              continue;
            }

            vm['pAvail'][c][key] = parseInt(vm['pAvail'][c][key]);
          }
        }

        saveSess(vm);
        self.switchDashboard('playerdashboard');
      });
      socket.emit('join-game', {
        "gameid": gameid,
        "is_admin": true,
        "upid": null
      });
    }
  }, {
    key: "render",
    value: function render() {
      return /*#__PURE__*/React.createElement("div", {
        "class": "grid-x grid-padding-x"
      }, /*#__PURE__*/React.createElement("div", {
        "class": "medium-4 medium-4 cell"
      }, /*#__PURE__*/React.createElement("label", null, "Mission ID:"), /*#__PURE__*/React.createElement("input", {
        type: "text",
        name: "gameid-login",
        id: "gameid-login",
        placeholder: "Enter Mission ID"
      }), /*#__PURE__*/React.createElement("button", {
        "class": "create_game_btn",
        onClick: this.joinGame
      }, "Join Mission")));
    }
  }]);

  return AdminLogin;
}(React.Component);

var Game = /*#__PURE__*/function (_React$Component14) {
  _inherits(Game, _React$Component14);

  var _super14 = _createSuper(Game);

  function Game() {
    var _this17;

    _classCallCheck(this, Game);

    _this17 = _super14.call(this);
    _this17.switchDashboard = _this17.switchDashboard.bind(_assertThisInitialized(_this17));
    _this17.joinGame = _this17.joinGame.bind(_assertThisInitialized(_this17));
    var dashboard = $('#dashboard-view').val();
    _this17.state = {
      "dashboard": dashboard
    };
    return _this17;
  }

  _createClass(Game, [{
    key: "switchDashboard",
    value: function switchDashboard(dashboard) {
      this.setState({
        "dashboard": dashboard
      });
    }
  }, {
    key: "joinGame",
    value: function joinGame() {
      var self = this;
      socket.on('resignin-game', function (data) {
        self.switchDashboard('playerdashboard');
      });
      socket.emit('resignin-game', {
        "gameid": vm['gameid']
      });
    }
  }, {
    key: "render",
    value: function render() {
      var _this18 = this;

      return /*#__PURE__*/React.createElement("div", {
        id: "game"
      }, function () {
        switch (_this18.state.dashboard) {
          case "gamesetup":
            return /*#__PURE__*/React.createElement(GameSetupDashboard, null);

          case "playerdashboard":
            return /*#__PURE__*/React.createElement(PlayerDashboard, null);

          case "admin":
            return /*#__PURE__*/React.createElement(GameAdmin, null);

          case "adminlogin":
            return vm['isGameActive'] == true && isCacheValid(vm) ? _this18.joinGame() : /*#__PURE__*/React.createElement(AdminLogin, {
              switchDashboard: _this18.switchDashboard
            });

          case "player-login":
            return vm['isGameActive'] == true && isCacheValid(vm) ? _this18.joinGame() : /*#__PURE__*/React.createElement(PlayerLogin, {
              switchDashboard: _this18.switchDashboard
            });
        }
      }());
    }
  }]);

  return Game;
}(React.Component);

$(document).foundation();
ReactDOM.render( /*#__PURE__*/React.createElement(Game, null), document.getElementById("app"));