const TRADE_TIMEOUT = 45;
const ALERT_TIMEOUT = 3000;
const BASE_ROUTE_IMGS = '/view/v1/asset/';
const player_ids = ['A', 'B', 'C', 'D']
const MISSION_CONDS = [0, 1, 2, 3];

const socket = io();

var vm = getSess();

const PLAYER_MAP = {
  'A': 0,
  'B': 1,
  'C': 2,
  'D': 3
};

const RESOURCE_NAME_MAP = {
    'food': 'Food',
    'water': 'Water',
    'medicine': 'Medicine',
    'supply': 'Construction Supply'
}

// TODO: clean me up - mappings should be direct from db
const PLAYER_FULLNAME_MAP = {
    'A': 'Alpha',
    'B': 'Bravo',
    'C': 'Charlie',
    'D': 'Delta',
    'Shelter': 'Shelter',
    'Distribution Center': 'Distribution Center',
    'Hospital': 'Hospital',
    'Bridge': 'Bridge'
}


function resetVm(isAdmin) {
  vm['gametime'] = vm['start_game_time'] ;
  vm['isGameActive'] = false;
  vm['activeTrades'] = (isAdmin)?[false, false, false, false]:[false, false, false];
  vm['freeTradeIdxs'] = (isAdmin)?[0, 1, 2, 3]:[0, 1, 2];
  vm['proposeTimer'] = TRADE_TIMEOUT;
  vm['proposeBtnTime'] = 0;
  vm['adminGameActive'] = false;
  vm['pAvail'] = [];
  vm['pDest'] = {};
}

function isCacheValid(vm) {
  return ('routeOrders' in vm);
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

class CreateGameWidget extends React.Component {
  constructor(props) {
    super(props);

    this.createGame = this.createGame.bind(this);
    this.swapDashboard = props.swapDashboard;

    var pts = JSON.parse($('#player_templates').val());
    var ids = [];

    var i;
    for (i = 0; i < pts.length; i++) {
      var p = pts[i];
      if (!ids.includes(p.template_id)) {
        ids.push(p.template_id);
      }
    }

    this.tableRowClasses = ['tr-template-1', 'tr-template-2', 'tr-template-3'];
    this.state = {
      "ids": ids,
      "gameid": "Click Create Game",
      "player_ids": []
    };
  }

  createGame() {
    var self = this;
    var trades = $('#trades').val();

    socket.emit('create-new-game', {
          time: parseInt($("#time").val()),
          trades: trades,
          sel_player_template: $("#player_template_select option:selected").val(),
          condition_num: $("#condition_num option:selected").val()
    });

    socket.on('create-new-game', function(data){
      var d = JSON.parse(data);

      self.setState({
        "ids": self.state['ids'],
        "gameid": d['gameid']
      });
    });

    return;
  }

  render() {
    return <div class="create_game_container" id="create_game_container">
      <h3>Create New Mission</h3><br/>
      <div class="player_template_label">Game template:</div>
      <select class="player_template_select" id="player_template_select">
        <option selected disabled hidden value="0">Select Template:</option>
        {this.state["ids"].map(i => {
            return <option value={i} class={this.tableRowClasses[i-1]}>Template {i}</option>;
        })}
      </select>
      <select class="player_template_select" id="condition_num">
        <option selected disabled hidden value="0">Select Condition:</option>
        {MISSION_CONDS.map(i => {
            return <option value={i} class='mission-cond'>Condition {i}</option>;
        })}
      </select>
      <input type="number" id="time" name="time" min="0" step="1" placeholder="Please Enter Time in Seconds"></input>
      <input type="hidden" id="trades" name="trades" placeholder="Please Enter Total Number of allowable Trades" value="100"></input>
      <button class="create_game_btn" onClick={this.createGame}>Create Mission</button>
      <label>New Mission ID: {this.state["gameid"]}</label>
      </div>
  }
}


class AvailPlayersWidget extends React.Component {
  constructor() {
    super();

    this.tableRowCnt = -1;
    this.tableRowClasses = ['tr-template-1', 'tr-template-2', 'tr-template-3']
    this.state = JSON.parse($('#player_templates').val());
  }

  render() {
    var self = this;

    return <div class="template_view">
    <h3>Available Player Templates</h3><br/>
        <table class="avail_player_table">
            <tr class='table-header'>
                <th>Name</th>
                <th>Food</th>
                <th>Water</th>
                <th>Medical Supply</th>
                <th>Construction</th>
            </tr>
            {this.state.map(function(item, i) {
              if (i%8 == 0) {
                if (self.tableRowCnt > 3) {
                  self.tableRowCnt = 0;
                } else {
                  self.tableRowCnt += 1;
                }
              }

              return <tr class={self.tableRowClasses[self.tableRowCnt]}><td>{PLAYER_FULLNAME_MAP[item.name]}</td><td>{item.food}</td><td>{item.water}</td><td>{item.medicine}</td><td>{item.supply}</td></tr>
            })}
         </table>
    </div>;
  }
}

class PlayerResAvail extends React.Component {
  constructor(prop) {
    super(prop);

    var playerTemplate = JSON.parse(vm['player_templates']);
    this.playerId = vm['player_id'];

    this.pIdx = PLAYER_MAP[this.playerId];

    if (this.playerId == 'admin') {
      this.singleTemplate = false;
    } else {
      this.singleTemplate = true;
    }

    this.state = {};

    saveSess(vm);
  }

  componentDidMount() {
    var self = this;

    socket.on('trade-accept-resources-updt', function(data) {
      var d = JSON.parse(data);
      var cur_player_id = vm['player_id'];
      var updateRes = function(pId, offerPlayer) {
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
          if (offerPlayer){
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
      }
      else if(cur_player_id === d['player_id_offered']) {
        updateRes(PLAYER_MAP[cur_player_id], true);
      }
      else if (cur_player_id === 'admin') {
        updateRes(PLAYER_MAP[d['player_id_accepted']], false);
        updateRes(PLAYER_MAP[d['player_id_offered']], true);
      }
    });
  }

  render() {
    var resourcesText = null;
    var self = this;
    var text = null;

    if (self.singleTemplate) {
      resourcesText =
      <div>
          <label class="sect-label">These are the resources available to you</label>
          <div>
            <div class="rtile">
              <div id="supply_food">Food: <span id="supply_food_val">{vm['pAvail'][self.pIdx].food}</span></div>
            </div>
            <div class="rtile">
              <div id="supply_water">Water: <span id="supply_water_val">{vm['pAvail'][self.pIdx].water}</span></div>
            </div>
            <div class="rtile">
              <div id="supply_medicine">Medicine: <span id="supply_medicine_val">{vm['pAvail'][self.pIdx].medicine}</span></div>
            </div>
            <div class="rtile">
              <div id="supply_supply">Construction: <span id="supply_supply_val">{vm['pAvail'][self.pIdx].supply}</span></div>
            </div>
          </div>
        </div>
    } else {
      resourcesText = <table class="avail_player_table">
        <tr class='table-header'>
          <th>Name</th>
          <th>Food</th>
          <th>Water</th>
          <th>Medical Supply</th>
          <th>Construction</th>
        </tr>
        {
          vm['pAvail'].map(function(item, i) {
            return <tr class='tr-template-1'><td>{PLAYER_FULLNAME_MAP[item.name]}</td><td>{item.food}</td><td>{item.water}</td><td>{item.medicine}</td><td>{item.supply}</td></tr>
          })
        }
      </table>
    }

    if (self.playerId == 'admin') {
      text =  <div class="grid-x grid-margin-x grid-margin-y">
      <div class="resources medium-6 cell" id="resources">
        {resourcesText}
      </div>
      <div class="trucks medium-6 cell" id="trucks">
        <table class="tg">
            <thead>
                <tr>
                    <th class="tg-1wig">Destination</th>
                    <th class="tg-1wig">Food</th>
                    <th class="tg-1wig">Water</th>
                    <th class="tg-1wig">Medicine</th>
                    <th class="tg-1wig">Construction</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="tg-1wig">Shelter</td>
                    <td class="tg-baqh">{vm['pDest']['Shelter'].food}</td>
                    <td class="tg-baqh">{vm['pDest']['Shelter'].water}</td>
                    <td class="tg-baqh">{vm['pDest']['Shelter'].medicine}</td>
                    <td class="tg-baqh">{vm['pDest']['Shelter'].supply}</td>
                </tr>
                <tr>
                    <td class="tg-1wig">Distribution Center</td>
                    <td class="tg-baqh">{vm['pDest']['Distribution Center'].food}</td>
                    <td class="tg-baqh">{vm['pDest']['Distribution Center'].water}</td>
                    <td class="tg-baqh">{vm['pDest']['Distribution Center'].medicine}</td>
                    <td class="tg-baqh">{vm['pDest']['Distribution Center'].supply}</td>
                </tr>
                <tr>
                    <td class="tg-1wig">Hospital</td>
                    <td class="tg-baqh">{vm['pDest']['Hospital'].food}</td>
                    <td class="tg-baqh">{vm['pDest']['Hospital'].water}</td>
                    <td class="tg-baqh">{vm['pDest']['Hospital'].medicine}</td>
                    <td class="tg-baqh">{vm['pDest']['Hospital'].supply}</td>
                </tr>
                <tr>
                    <td class="tg-1wig">Bridge</td>
                    <td class="tg-baqh">{vm['pDest']['Bridge'].food}</td>
                    <td class="tg-baqh">{vm['pDest']['Bridge'].water}</td>
                    <td class="tg-baqh">{vm['pDest']['Bridge'].medicine}</td>
                    <td class="tg-baqh">{vm['pDest']['Bridge'].supply}</td>
                </tr>
            </tbody>
        </table>
      </div>
    </div>
    } else {
      text =  <div class="grid-x grid-margin-x grid-margin-y">
      <div class="resources medium-6 cell" id="resources">
        {resourcesText}
      </div>
      <div class="trucks medium-6 cell" id="trucks">
        <label class="dest-sect-label">These are the approximate destinations requirements </label>
        <table class="tg">
            <thead>
                <tr>
                    <th class="tg-1wig">Destination</th>
                    <th class="tg-1wig">Food</th>
                    <th class="tg-1wig">Water</th>
                    <th class="tg-1wig">Medicine</th>
                    <th class="tg-1wig">Construction</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="tg-1wig">Shelter</td>
                    <td class="tg-baqh">{vm['pDest']['Shelter'].food_range}</td>
                    <td class="tg-baqh">{vm['pDest']['Shelter'].water_range}</td>
                    <td class="tg-baqh">{vm['pDest']['Shelter'].medicine_range}</td>
                    <td class="tg-baqh">{vm['pDest']['Shelter'].supply_range}</td>
                </tr>
                <tr>
                    <td class="tg-1wig">Distribution Center</td>
                    <td class="tg-baqh">{vm['pDest']['Distribution Center'].food_range}</td>
                    <td class="tg-baqh">{vm['pDest']['Distribution Center'].water_range}</td>
                    <td class="tg-baqh">{vm['pDest']['Distribution Center'].medicine_range}</td>
                    <td class="tg-baqh">{vm['pDest']['Distribution Center'].supply_range}</td>
                </tr>
                <tr>
                    <td class="tg-1wig">Hospital</td>
                    <td class="tg-baqh">{vm['pDest']['Hospital'].food_range}</td>
                    <td class="tg-baqh">{vm['pDest']['Hospital'].water_range}</td>
                    <td class="tg-baqh">{vm['pDest']['Hospital'].medicine_range}</td>
                    <td class="tg-baqh">{vm['pDest']['Hospital'].supply_range}</td>
                </tr>
                <tr>
                    <td class="tg-1wig">Bridge</td>
                    <td class="tg-baqh">{vm['pDest']['Bridge'].food_range}</td>
                    <td class="tg-baqh">{vm['pDest']['Bridge'].water_range}</td>
                    <td class="tg-baqh">{vm['pDest']['Bridge'].medicine_range}</td>
                    <td class="tg-baqh">{vm['pDest']['Bridge'].supply_range}</td>
                </tr>
            </tbody>
        </table>
      </div>
    </div>
    }

    return <div class="resources-group large-6-up cell">
             {text}
            </div>
  }
}

class PlayerTradeReq extends React.Component {
  constructor() {
    super()

    this.proposeTrade = this.proposeTrade.bind(this);
    this.startProposeBtnTimer = this.startProposeBtnTimer.bind(this);
    this.gamealert = false;
    this.playerId = vm['player_id'];
    this.proposeBtnTimer = false;
  }

  startProposeBtnTimer() {
    var self = this;

    self.proposeBtnTimer = setInterval(() => {
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

  componentDidMount() {
    var self = this;

    if (self.playerId == 'admin') {
      $('.trade-resources').css('visibility', 'hidden');
    }

    socket.on('trade-accept', function(data){
      var d = JSON.parse(data);
      var cur_player_id = vm['player_id'];

      if (cur_player_id === d['player_id_offered']) {
        $('#game-alert-notify').text('Warehouse Manager ' + d['player_id_accepted'] + ' accepted your offer!');

        $('#trade_propose_btn').removeAttr('disabled');
        vm['proposeBtnTime'] = 0; 

        clearInterval(self.proposeBtnTimer);

        self.gamealert = setInterval(() => {
          $('#game-alert-notify').text('');
          if (self.gamealert !== false) {
            clearInterval(self.gamealert);
            self.gamealert = false;
          }
        }, ALERT_TIMEOUT);
      }
    });

    socket.on('trade-already-taken', function(data){
      var d = JSON.parse(data);
      var cur_player_id = vm['player_id'];

      if (cur_player_id === d['player_id_accepted']) {
        self.gamealert = setInterval(() => {
          $('#game-alert-notify').text('Trade already accepted by another Warehouse Manager!');
          if (self.gamealert !== false) {
            clearInterval(self.gamealert);
            self.gamealert = false;
          }
        }, ALERT_TIMEOUT);
      }
    });

    socket.on('propose-deny', function(data){
      var d = JSON.parse(data);
      var cur_player_id = vm['player_id'];
      var offerFound = false;
      var c = 0;

      $('#trade_propose_btn').removeAttr('disabled');
      vm['proposeBtnTime'] = 0; 

      clearInterval(self.proposeBtnTimer);

      for (; c< rejected_offers.length; c++) {
        if (rejected_offers[c] === d['trade_id']) {
          offerFound = True;
          break;
        }
      }

      if (!offerFound && cur_player_id === d['player_id_offered']) {
        rejected_offers.push(d['trade_id']);
          $('#game-alert-notify').text('All players rejected your offer!');
  
          self.gamealert = setInterval(() => {
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

  componentWillUnmount() {
    if (this.gamealert !== false) {
      clearInterval(this.gamealert);
    }

    if (this.proposeBtnTimer !== false) {
      clearInterval(this.proposeBtnTimer);
    }
  }

  proposeTrade() {
    var self = this;
    var offer_amount = $('#offer_amount').val();
    var resource = $("#offer_select option:selected").val();
    var player_id_offered = vm['player_id'];
    var gameid = vm['gameid'];
    var availResAmount = parseInt($('#supply_' + resource + '_val').text())

    vm['proposeBtnTime'] = TRADE_TIMEOUT;
    self.startProposeBtnTimer();

    if (offer_amount <= 0) {
      $('#game-alert-notify').text('You must enter a positive number!');
    }
    else if (offer_amount > availResAmount) {
      $('#game-alert-notify').text('You do not have enough for this offer!');
    } else {
      $('#game-alert-notify').text('Your offer has been posted!');
      $('#trade_propose_btn').attr('disabled', '');

      socket.emit('propose-trade',
      {
        "offer_amount": offer_amount,
        "resource": resource,
        "gameid": gameid,
        "player_id_offered": player_id_offered,
        "trade_expire": new Date().valueOf()+TRADE_TIMEOUT
      });
    }

    self.gamealert = setInterval(() => {
      $('#game-alert-notify').text('');
      if (self.gamealert !== false) {
        clearInterval(self.gamealert);
        self.gamealert = false;
      }
    }, ALERT_TIMEOUT);
  }

  render() {
    return <div class="trade trade-resources large-6 medium-6 cell" id="trade">
            <h5>Resources can be offered to other players to help them achieve their goals
            Offer the following:</h5>
            <input class="offer_input" placeholder="Make Offer" type="number" id="offer_amount"></input>
            <select id="offer_select">
                <option value="food">Food</option>
                <option value="water">Water</option>
                <option value="medicine">Medicine</option>
                <option value="supply">Construction</option>
            </select>
            <button class="trade_propose_btn button" onClick={this.proposeTrade} id="trade_propose_btn">Propose Offer!</button>
        </div>
  }
}

class PlayerTradeAccept extends React.Component {
  constructor(props) {
    super(props);

    this.acceptTrade = this.acceptTrade.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this.playerId = vm['player_id'];
    this.state = {
      "activeTrades": vm['activeTrades'],
      "freeTradeIdxs": vm['freeTradeIdx'],
      "tradeIntervals": (vm['player_id']=='admin')?[false, false, false, false]:[false, false, false]
    };
  }

  componentDidMount() {
    var self = this;
    var playerId = vm['player_id'];
    var gameid = vm['gameid'];
    var tradeIntervals = this.state['tradeIntervals'];
    
    var tradeCntDown = function(i) {
      tradeIntervals[i] = setInterval(() => {
          if (vm['activeTrades'][i].trade_cnt_down > 0) {
              vm['activeTrades'][i].trade_cnt_down -= 1;

              saveSess(vm);

              self.setState({
                "activeTrades": vm['activeTrades']
              });
          } else {
              socket.emit('propose-deny',
              {
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

              self.setState({"activeTrades": vm['activeTrades']});
            
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

    socket.on('propose-trade', function(data) {
      var d = JSON.parse(data);
      var gameid = vm['gameid'];
      var player_id_accepted = vm['player_id'];
      
      if (playerId === d['player_id_offered']){
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

      self.setState({"activeTrades": vm['activeTrades']});

      saveSess(vm);
    });

    socket.on('trade-accept-offer-updt', function(data) {
      var d = JSON.parse(data);
      var tradeIntervals = self.state.tradeIntervals;

      if (playerId === d['player_id_offered']){
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

        self.setState({"activeTrades": vm.activeTrades});
      }
    });
  }

  componentWillUnmount() {
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

  acceptTrade(trade_idx) {
    var self = this;
    var gameid = vm['gameid'];
    var trade = self.state['activeTrades'][trade_idx];
    var player_id_accepted = vm['player_id'];

    socket.emit('trade-accept',
    {
      "gameid": gameid,
      "player_id_accepted": player_id_accepted,
      "player_id_offered": trade['player_id_offered'],
      "offer_amount": trade['offer_amount'],
      "resource": trade['resource'],
      "trade_id": trade['trade_id']
    }
    );
  }

  render() {
    var self = this;
    var text = null;

    if (self.playerId == 'admin') {
      text = self.state['activeTrades'].map(function(item, i) {
        return <div key={i}>
        <div class="otile">
        <div id={"trade_offer_p"+i+1}>
          {
            (!item) ? "No offers at this time!" : "Warehouse " + item.player_id_offered + " offered " + item.offer_amount + " " + RESOURCE_NAME_MAP[item.resource.toLowerCase().trim()]
          }
        </div>
      </div>
      <label></label><p><label>Offer Remaining Time: </label><label>{item.trade_cnt_down}</label></p>
    </div>
    });
    } else {
        text = self.state['activeTrades'].map(function(item, i) {
          return <div key={i}>
          <div class="otile">
          <div id={"trade_offer_p"+i+1}>
            {
              (!item) ? "No offers at this time!" : "Warehouse " + item.player_id_offered + " offered " + item.offer_amount + " " + RESOURCE_NAME_MAP[item.resource.toLowerCase().trim()]
            }
          </div>
        </div>
        <button class="trade_accept_button button" onClick={e => self.acceptTrade(i)}>Accept</button><label></label><p><label>Offer Remaining Time: </label><label>{item.trade_cnt_down}</label></p></div>
      })
    }

    return <div class="trade_proposals large-6 cell" id="trade_proposals">
              <label>Offers from other players: </label><br/>
              {text}  
          </div>
  }
}


class PlayerInfo extends React.Component {
  render () {
        return <div class="game_info">
                  <div class="information" id="information"></div>
              </div>
  }
}

class PlayerGoalSelect extends React.Component {
  constructor() {
    super();

    this.proposeResources = this.proposeResources.bind(this);
    this.playerId = vm['player_id'];
  }

  componentDidMount() {
    var c = 1;
    var self = this;
    if (self.playerId == 'admin') {
      for (; c < 5; c++) {
        $('#player-'+ c +'-pg-choices').removeClass('disabled');
      }
    }

    var player_id_map = {
      "A": "1",
      "B": "2",
      "C": "3",
      "D": "4"
    };
    var cur_player_id = vm['player_id'];
    socket.on('propose-resource', function(data){
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
            $("#dest"+(c+1)+"-sel").val(choices[c]);
          }

          break;

        case 'C':
          var c = 0;
          for (; c < 4; c++) {
            $("#truck"+(c+1)+"-sel").val(choices[c]);
          }

          break;

        case 'D':
          var c = 0;
          for (; c < 4; c++) {
            $("#route"+(c+1)+"-sel").val(choices[c]);
          }

          break;
      }
    });

    if (cur_player_id === "A") {
      $(function() {
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


  proposeResources() {
    var player_id = vm['player_id'];
    var upid = vm['upid']
    var gameid = vm['gameid'];

    var choices = [];
    switch (player_id) {
      case 'A':
        var c = 0
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
    for(; c < choices.length; c++) {
      if (parseInt(choices[c]) === 0){
        return;
      }
    }

    socket.emit('propose-resource',
      {
        "player_id": player_id,
        "upid": upid,
        "choices": choices,
        "gameid": gameid
      });
  }

  startGame() {
    var gameid = vm['gameid'];

    $('#start_game_btn').attr('disabled', '');

    socket.emit('start-game',
      {
        "gameid": gameid
      });
  }

  stopGame() {
    var gameid = vm['gameid'];

    $('#start_game_btn').removeAttr('disabled');

    socket.emit('stop-game',
      {
        "gameid": gameid,
        "gametime": vm['gametime']
      });
  }

  render () {
        return <div class="resource-goals large-up-6 cell" id="resource-goals">
                <div class="grid-x grid-margin-x grid-margin-y">
                  <div id="player-1-pg-choices" class="trade medium-3 cell disabled">
                    <label>Please Select the Priorities</label>
                    <ol id="priority-sel">
                      <li class="priority-sel-item ui-state-default"><span class="ui-icon ui-icon-arrowthick-2-n-s"></span>Shelter</li>
                      <li class="priority-sel-item ui-state-default"><span class="ui-icon ui-icon-arrowthick-2-n-s"></span>Distribution Center</li>
                      <li class="priority-sel-item ui-state-default"><span class="ui-icon ui-icon-arrowthick-2-n-s"></span>Hospital</li>
                      <li class="priority-sel-item ui-state-default"><span class="ui-icon ui-icon-arrowthick-2-n-s"></span>Bridge</li>
                    </ol>
                  </div>
                  <div id="player-2-pg-choices" class="trade medium-3 cell disabled">
                    <label>Please Assign Destinations</label>
                    <label for="dest1-sel">Shelter</label>
                    <select id="dest1-sel" class="dest1-sel player-sel" disabled>
                      <option selected disabled hidden value="0">Choose Warehouse:</option>
                      <option value="1">Alpha</option>
                      <option value="2">Bravo</option>
                      <option value="3">Charlie</option>
                      <option value="4">Delta</option>
                    </select>
                    <label for="dest2-sel">Center</label>
                    <select id="dest2-sel" class="dest2-sel player-sel" disabled>
                      <option selected disabled hidden value="0">Choose Warehouse:</option>
                      <option value="1">Alpha</option>
                      <option value="2">Bravo</option>
                      <option value="3">Charlie</option>
                      <option value="4">Delta</option>
                    </select>
                    <label for="dest3-sel">Hospital</label>
                    <select id="dest3-sel" class="dest3-sel player-sel" disabled>
                      <option selected disabled hidden value="0">Choose Warehouse:</option>
                      <option value="1">Alpha</option>
                      <option value="2">Bravo</option>
                      <option value="3">Charlie</option>
                      <option value="4">Delta</option>
                    </select>
                    <label for="dest4-sel">Bridge</label>
                    <select id="dest4-sel" class="dest4-sel player-sel" disabled>
                      <option selected disabled hidden value="0">Choose Warehouse:</option>
                      <option value="1">Alpha</option>
                      <option value="2">Bravo</option>
                      <option value="3">Charlie</option>
                      <option value="4">Delta</option>
                    </select>
                  </div>
                  <div id="player-3-pg-choices" class="trade medium-3 cell disabled">
                    <label>Please Select the Truck</label>
                    <label for="truck1-sel">Truck 1</label>
                    <select id="truck1-sel" class="truck1-sel player-sel" disabled>
                      <option selected disabled hidden value="0">Choose Warehouse:</option>
                      <option value="1">Alpha</option>
                      <option value="2">Bravo</option>
                      <option value="3">Charlie</option>
                      <option value="4">Delta</option>
                    </select>
                    <label for="truck2-sel">Truck 2</label>
                    <select id="truck2-sel" class="truck2-sel player-sel" disabled>
                      <option selected disabled hidden value="0">Choose Warehouse:</option>
                      <option value="1">Alpha</option>
                      <option value="2">Bravo</option>
                      <option value="3">Charlie</option>
                      <option value="4">Delta</option>
                    </select>
                    <label for="truck3-sel">Truck 3</label>
                    <select id="truck3-sel" class="truck3-sel player-sel" disabled>
                      <option selected disabled hidden value="0">Choose Warehouse:</option>
                      <option value="1">Alpha</option>
                      <option value="2">Bravo</option>
                      <option value="3">Charlie</option>
                      <option value="4">Delta</option>
                    </select>
                    <label for="truck4-sel">Truck 4</label>
                    <select id="truck4-sel" class="truck4-sel player-sel" disabled>
                      <option selected disabled hidden value="0">Choose Warehouse:</option>
                      <option value="1">Alpha</option>
                      <option value="2">Bravo</option>
                      <option value="3">Charlie</option>
                      <option value="4">Delta</option>
                    </select>
                  </div>
                  <div id="player-4-pg-choices" class="trade medium-3 cell disabled">
                    <label>Please Select the Route</label>
                    <label for="route1-sel">Alpha</label>
                    <select id="route1-sel" class="route1-sel player-sel" disabled>
                      <option selected disabled hidden value="0">Choose Route:</option>
                      <option value="1">Route 1</option>
                      <option value="2">Route 2</option>
                      <option value="3">Route 3</option>
                      <option value="4">Route 4</option>
                    </select>
                    <label for="route2-sel">Bravo</label>
                    <select id="route2-sel" class="route2-sel player-sel" disabled>
                      <option selected disabled hidden value="0">Choose Route:</option>
                      <option value="1">Route 1</option>
                      <option value="2">Route 2</option>
                      <option value="3">Route 3</option>
                      <option value="4">Route 4</option>
                    </select>
                    <label for="route3-sel">Charlie</label>
                    <select id="route3-sel" class="route3-sel player-sel" disabled>
                      <option selected disabled hidden value="0">Choose Route:</option>
                      <option value="1">Route 1</option>
                      <option value="2">Route 2</option>
                      <option value="3">Route 3</option>
                      <option value="4">Route 4</option>
                    </select>
                    <label for="route4-sel">Delta</label>
                    <select id="route4-sel" class="route4-sel player-sel" disabled>
                      <option selected disabled hidden value="0">Choose Route:</option>
                      <option value="1">Route 1</option>
                      <option value="2">Route 2</option>
                      <option value="3">Route 3</option>
                      <option value="4">Route 4</option>
                    </select>
                  </div>
                </div>
                <div class="grid-x grid-margin-x grid-margin-y">
                  <div class="resource_sect medium-up-6 cell">
                      {(() => {
                        switch (this.playerId) {
                          case "admin": return <div>
                                                    <button class="resource_propose button" onClick={this.startGame} id="start_game_btn">Start Mission</button>
                                                    <button class="resource_propose button" onClick={this.stopGame} id="stop_game_btn">End Mission</button>
                                               </div>
                          default: return <button class="resource_propose button" onClick={this.proposeResources} id="resource_propose_btn">Propose!</button>;
                        }
                      })()}
                  </div>
                </div>
              </div>
  }
}

class PlayerTimer extends React.Component {
  constructor(props) {
    super(props);

    this.gamealert = false;

    this.time_tracker = new Date();

    this.state = {
      "gametime": vm['start_game_time'],
      "game-start": '',
      "showScore": false,
      'score': 0
    };
  }

  componentDidMount() {
     var self = this;

     var startTimer = function() {
        self.gameinterval = setInterval(() => {
          if (vm['gametime'] > 0) {
              vm['gametime'] = vm['gametime_end']-Math.floor(new Date().getTime()/1000.0);

              saveSess(vm);

              self.setState({
                "gametime": vm['gametime']
              });
          } else {
              clearInterval(self.gameinterval);

              self.gameinterval = false;

              self.gamealert = setInterval(() => {
                if (self.gamealert !== false) {
                  clearInterval(self.gamealert);
                  self.gamealert = false;
                }
              }, ALERT_TIMEOUT);
            }
        }, 1000);
      };

       socket.on('start-game', function(data) {
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

        gamestart = setInterval(() => {
          clearInterval(gamestart);
          self.setState({
            'game-state': ''
          });
        }, ALERT_TIMEOUT);

        startTimer();
      });

      socket.on('stop-game', function(data) {
          var gametime = self.state.gametime;
          var min = gametime/60;

          vm['adminGameActive'] = false;
          vm['gametime'] = vm['start_game_time'] ;

          self.setState({
            "game-state": "end"
          });

          vm['gametime_end'] = null;
          
          saveSess(vm);

          clearInterval(self.gameinterval);
          self.gameinterval = false;

          self.gamealert = setInterval(() => {
            if (self.gamealert !== false) {
              clearInterval(self.gamealert);
              self.gamealert = false;
            }

            self.setState({
              'game-state': '',
              'showScore': true,
              'score': ((vm['start_game_time']/60)+min)*100
            });
          }, ALERT_TIMEOUT);
      });

      if (vm['adminGameActive']) {
        startTimer();
      }
    }

  componentWillUnmount() {
    if (this.gameinterval !== false) {
      clearInterval(this.gameinterval);
      this.gameinterval = false;
    }

    if (this.gamealert !== false) {
      clearInterval(this.gamealert);
      this.gamealert = false;
    }
  }

  render() {
    return <div class="playertimer large-6 cell">
            {(() => {
                 if (this.state['showScore']==true) {
                  return <h3 class="player-timer-label">Score: {this.state.score.toFixed(2)}</h3>;
                }
            })()}
            <h3 class="player-timer-label">Time Left in Mission: <br/>
                {(() => {
                    var minutes = Math.floor(this.state.gametime/60);
                    var sec = this.state.gametime-minutes*60;

                    return ' ' + minutes + ' Minutes, ' + sec + ' Seconds';
                })()}
            </h3>
            {(() => {
              switch (this.state['game-state']) {
                case "start": return <h3 class="player-timer-label">Mission Started!</h3>
                case "end": return <h3 class="player-timer-label">Mission Ended</h3>;
              }
            })()}
            <h3 id="game-alert-notify"></h3>
        </div>
  }
}

class PlayerLog extends React.Component {
  render() {
    return <div class="log large-up-6 cell">
      Event log: <br/>
      <textarea class="log_text" id="log_text" disabled></textarea>
    </div>
  }
}

class PlayerDashboard extends React.Component {
  constructor(props) {
    super(props)

    var warehouseMap = {
      'A': 'Alpha',
      'B': 'Bravo',
      'C': 'Charlie',
      'D': 'Delta'
    };

    this.logout = this.logout.bind(this);

    this.playerId = vm['player_id'];    

    this.warehouse = warehouseMap[this.playerId]; 

    this.state = {
      "is_admin": vm['is_admin'],
      "gametime": vm['start_game_time']
    };
  }

  logout() {
    vm['isGameActive'] = false;
    saveSess(vm);

    window.location.reload();
  }

  componentDidMount() {
    $( "#tabs" ).tabs();
  }
  render() {
    return <div id="tabs" class="main-content" class="content grid-container">
      <ol id="maindash-buttons">
        <li><a href="#pdashboard" class="button">Dashboard</a></li>
        <li><a href="#pmap1" class="button">Route 1</a></li>
        <li><a href="#pmap2" class="button">Route 2</a></li>
        <li><a href="#pmap3" class="button">Route 3</a></li>
        <li><a href="#pmap4" class="button">Route 4</a></li>
        <li><a href="#pquest1" class="button">Questionaire 1</a></li>
        <li><a href="#pquest2" class="button">Questionaire 2</a></li>
        <li><h5 class='dash-title'>Warehouse {this.warehouse}</h5></li>
        <li><h5 class='dash-title game-id-title'>Mission ID {vm['gameid']}</h5></li>
        <li><h5 id="dash-logout-btn" class="button" onClick={this.logout}>Logout</h5></li>
      </ol>
      <div id="pdashboard">
        <div class="grid-x grid-margin-x">
          <PlayerGoalSelect />
        </div>
        <div class="grid-x grid-margin-x">
          <PlayerResAvail />
        </div>
        <div class="grid-x grid-margin-x">
          <div class="medium-6 cell">
            <div class="grid-y grid-margin-y">
              <div class="medium-6 cell">
                <PlayerTradeReq />
              </div>
              <div class="medium-6 cell">
                <PlayerTimer />
              </div>
            </div>
          </div>
            <PlayerTradeAccept />
        </div>
        <div class="grid-x grid-margin-x">
          {(() => {
            switch (this.state['is_admin']) {
              case "admin": return <PlayerLog />;
              case "": return "";
            }
          })()}
        </div>
      </div>

      {vm["routeOrders"].map(function(item, i) {
            return <div id={"pmap"+(i+1)}><img src={BASE_ROUTE_IMGS+'route'+item+'.jpg'} height="770" width="1024" /></div>;
      })}
      <div id="pquest1">Questionaire 1 HERE</div>
      <div id="pquest2">Questionaire 2 HERE</div>
    </div>
  }
}

class GameSetupDashboard extends React.Component {
  constructor (props) {
    super(props);

    this.swapDashboard = props.swapDashboard;
  }

  render() {
    return <div id="main-content" class="content grid-container">
      <div class="grid-x grid-padding-x">
        <div class="medium-4 medium-4 cell">
          <CreateGameWidget swapDashboard={this.swapDashboard}/>
        </div>
          <div class="medium-4 medium-4 cell">
            <AvailPlayersWidget/>
          </div>
      </div>
    </div>
  }
}

class PlayerLogin extends React.Component {
  constructor(props) {
    super(props);

    this.switchDashboard = props.switchDashboard;
    
    this.joinGame = this.joinGame.bind(this);
  }

  joinGame(e, gameid) {
    var self = this;

    if (e) {
      e.preventDefault();
    }

    socket.on('join-game', function(data) {
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
      vm['start_game_time'] = d['start_game_time']
      vm['routeOrders'] = d['routeOrders'];
      
      var c = 0;
      for(; c < player_templates.length; c++) {
          var t = player_templates[c];

          if (t.dest_need == "0") {
              vm['pAvail'].push(t);
          } else {
              if (t.name == 'Distribution Center' || t.name == 'Hospital'
              || t.name == 'Bridge' || t.name == 'Shelter') {
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

  render() {
    return  <div class="grid-x grid-padding-x">
               <div class="medium-4 medium-4 cell">
                 <label>Mission ID:</label><input type="text" name="gameid-login" id="gameid-login" placeholder="Enter Mission ID"></input>
                 <button class="create_game_btn" onClick={(e) => this.joinGame(e, $('#gameid-login').val())}>Join Mission</button>
               </div>
             </div>
  }
}

class AdminLogin extends React.Component {
  constructor(props) {
    super(props);

    this.switchDashboard = props.switchDashboard;
    this.joinGame = this.joinGame.bind(this);
  }

  joinGame(e) {
    var self = this;

    e.preventDefault();

    var gameid = $('#gameid-login').val();
    socket.on('join-game', function(data){
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
      for(; c < player_templates.length; c++) {
          var t = player_templates[c];

          if (t.dest_need == "0") {
              vm['pAvail'].push(t);
          } else {
              if (t.name == 'Distribution Center' || t.name == 'Hospital'
              || t.name == 'Bridge' || t.name == 'Shelter') {
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

  render() {
    return  <div class="grid-x grid-padding-x">
               <div class="medium-4 medium-4 cell">
                 <label>Mission ID:</label><input type="text" name="gameid-login" id="gameid-login" placeholder="Enter Mission ID"></input>
                 <button class="create_game_btn" onClick={this.joinGame}>Join Mission</button>
               </div>
             </div>
  }
}


class Game extends React.Component {
  constructor() {
    super();

    this.switchDashboard = this.switchDashboard.bind(this);
    this.joinGame = this.joinGame.bind(this);

    var dashboard = $('#dashboard-view').val();

    this.state = {
      "dashboard": dashboard
    };
  }

  switchDashboard(dashboard) {
    this.setState(
        {
            "dashboard": dashboard
        }
    );
  }

  joinGame() {
    var self = this;

    socket.on('resignin-game', function(data){
      self.switchDashboard('playerdashboard');
    });

    socket.emit('resignin-game', {
      "gameid": vm['gameid']
    });
  }

  render() {
    return <div id='game'>
      {(() => {
        switch (this.state.dashboard) {
          case "gamesetup": return <GameSetupDashboard />;
          case "playerdashboard": return <PlayerDashboard />;
          case "admin": return <GameAdmin />;
          case "adminlogin": return vm['isGameActive']==true && isCacheValid(vm)?this.joinGame():<AdminLogin switchDashboard={this.switchDashboard} />;
          case "player-login": return vm['isGameActive']==true && isCacheValid(vm)?this.joinGame():<PlayerLogin switchDashboard={this.switchDashboard} />;
        }
      })()}
    </div>
  }
}

$(document).foundation();
ReactDOM.render(<Game/>, document.getElementById("app"));
