import copy
import json
import pprint
import secrets
import sys
import time
import traceback
from collections import OrderedDict
from datetime import datetime

import config
import pytz
from api.v1.model import nandor
from config import app, socketio
from flask import current_app
from flask import render_template
from flask_socketio import emit, join_room


PLAYER_ID_MAP_RESULTS = OrderedDict([(1, 'Alpha'),
                                     (2, 'Bravo'),
                                     (3, 'Charlie'),
                                     (4, 'Delta')])

DESTINATION_ID_MAP_RESULTS = OrderedDict([(1, 'Shelter'),
                                          (2, 'Center'),
                                          (3, 'Hospital'),
                                          (4, 'Bridge')]
                                         )

IDEAL = {
    'mission-1': OrderedDict(
        [('priority', ['Bridge', 'Hospital', 'Distribution Center', 'Shelter']),
         ('destination', OrderedDict(
             [(DESTINATION_ID_MAP_RESULTS.get(1), PLAYER_ID_MAP_RESULTS.get(4)),
              (DESTINATION_ID_MAP_RESULTS.get(2), PLAYER_ID_MAP_RESULTS.get(3)),
              (DESTINATION_ID_MAP_RESULTS.get(3), PLAYER_ID_MAP_RESULTS.get(2)),
              (DESTINATION_ID_MAP_RESULTS.get(4), PLAYER_ID_MAP_RESULTS.get(1))]
         )),
         ('trucks', OrderedDict(
             [(1, PLAYER_ID_MAP_RESULTS.get(1)),
              (2, PLAYER_ID_MAP_RESULTS.get(2)),
              (3, PLAYER_ID_MAP_RESULTS.get(3)),
              (4, PLAYER_ID_MAP_RESULTS.get(4))]
         )),
         ('routes', OrderedDict(
             [(PLAYER_ID_MAP_RESULTS.get(1), 4),
              (PLAYER_ID_MAP_RESULTS.get(2), 4),
              (PLAYER_ID_MAP_RESULTS.get(3), 4),
              (PLAYER_ID_MAP_RESULTS.get(4), 4)]
         )),
         ('num-of-moves', 6)]
    ),
    'mission-2': OrderedDict([
        ('priority', ['Bridge', 'Shelter', 'Distribution Center', 'Hospital']),
        ('destination', OrderedDict(
            [(DESTINATION_ID_MAP_RESULTS.get(1), PLAYER_ID_MAP_RESULTS.get(2)),
             (DESTINATION_ID_MAP_RESULTS.get(2), PLAYER_ID_MAP_RESULTS.get(1)),
             (DESTINATION_ID_MAP_RESULTS.get(3), PLAYER_ID_MAP_RESULTS.get(4)),
             (DESTINATION_ID_MAP_RESULTS.get(4), PLAYER_ID_MAP_RESULTS.get(3))]
        )),
        ('trucks', OrderedDict(
            [(1, PLAYER_ID_MAP_RESULTS.get(1)),
             (2, PLAYER_ID_MAP_RESULTS.get(2)),
             (3, PLAYER_ID_MAP_RESULTS.get(4)),
             (4, PLAYER_ID_MAP_RESULTS.get(3))]
        )),
        ('routes', OrderedDict(
            [(PLAYER_ID_MAP_RESULTS.get(1), 3),
             (PLAYER_ID_MAP_RESULTS.get(2), 3),
             (PLAYER_ID_MAP_RESULTS.get(3), 3),
             (PLAYER_ID_MAP_RESULTS.get(4), 3)]
        )),
        ('num-of-moves', 10)
    ])
}


def laven_dist(list1, list2):
    m = len(list1)
    n = len(list2)
    dp = [[0 for x in range(n + 1)] for x in range(m + 1)]

    # Fill d[][] in bottom up manner
    for i in range(m + 1):
        for j in range(n + 1):

            # If first string is empty, only option is to
            # insert all characters of second string
            if i == 0:
                dp[i][j] = j  # Min. operations = j

            # If second string is empty, only option is to
            # remove all characters of second string
            elif j == 0:
                dp[i][j] = i  # Min. operations = i

            # If last characters are same, ignore last char
            # and recur for remaining string
            elif list1[i - 1] == list2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]

                # If last character are different, consider all
            # possibilities and find minimum
            else:
                dp[i][j] = 1 + min(dp[i][j - 1],  # Insert
                                   dp[i - 1][j],  # Remove
                                   dp[i - 1][j - 1])  # Replace

    return dp[m][n]


PLAYER_ID_MAP = {
    'A': 0,
    'B': 1,
    'C': 2,
    'D': 3
}

with app.app_context():
    current_app.config['sess'] = dict()


def get_current_utc():
    return int(datetime.timestamp(datetime.now(pytz.timezone("UTC"))))


@app.route('/health', methods=['GET'])
def health():
    return 'health is good'


@app.route('/', methods=['GET'])
def init_game():
    player_templates = nandor.PlayerTemplate.query.all()

    player_template_json = json.dumps([p.to_dict() for p in player_templates])
    # return 'hello'
    return render_template('app.html', player_template_json=player_template_json, gameid=None,
                           sess=None, view='gamesetup', is_admin=None)


@app.route('/results', methods=['GET'])
def results():
    content = OrderedDict()
    sess = current_app.config['sess']

    if sess.get('gameid') is not None:

        try:
            game_id = sess.get('gameid').get('gameid')
            selected_template = sess.get('gameid').get('sel_player_template')

            content['game_id'] = game_id
            content['select_template'] = selected_template

            # return a list of trades with game id = game | from nandor.py read Class Trade for info
            all_trade_moves = nandor.Trade.query.filter_by(game_id=game_id)

            not_null_trade_moves = len([x for x in all_trade_moves if x.dst_player is not None])
            
            priorities = nandor.db.engine.execute(
                f"SELECT goal FROM EXP.goals where game_id = '{game_id}' AND SRC_PLAYER = 0 order by time DESC limit 1;").fetchone()

            destinations = nandor.db.engine.execute(
                f"SELECT goal FROM EXP.goals where game_id = '{game_id}' AND SRC_PLAYER = 1 order by time DESC limit 1;").fetchone()

            truck = nandor.db.engine.execute(
                f"SELECT goal FROM EXP.goals where game_id = '{game_id}' AND SRC_PLAYER = 2 order by time DESC limit 1;").fetchone()

            route = nandor.db.engine.execute(
                f"SELECT goal FROM EXP.goals where game_id = '{game_id}' AND SRC_PLAYER = 3 order by time DESC limit 1;").fetchone()
            
            if type(priorities) == type(None):
                return render_template('beautiful_results.html',
                                       error='There was no selected priority, please complete the game or start a new '
                                             'one',
                                       title='Results - Error')

            actual_priorities_list = priorities.goal[2:-2].split('", "')

            if type(destinations) == type(None):
                return render_template('beautiful_results.html',
                                       error='There was no selected priority, please complete the game or start a new '
                                             'one',
                                       title='Results - Error')
            actual_destinations = destinations.goal[2:-2].split('", "')
            actual_destinations_dict = OrderedDict(
                [
                    (DESTINATION_ID_MAP_RESULTS.get(1), PLAYER_ID_MAP_RESULTS.get(int(actual_destinations[0]))),
                    (DESTINATION_ID_MAP_RESULTS.get(2), PLAYER_ID_MAP_RESULTS.get(int(actual_destinations[1]))),
                    (DESTINATION_ID_MAP_RESULTS.get(3), PLAYER_ID_MAP_RESULTS.get(int(actual_destinations[2]))),
                    (DESTINATION_ID_MAP_RESULTS.get(4), PLAYER_ID_MAP_RESULTS.get(int(actual_destinations[3])))
                ]
            )

            if type(truck) == type(None):
                return render_template('beautiful_results.html',
                                       error='There was no selected truck, please complete the game or start a new '
                                             'one',
                                       title='Results - Error')
            actual_trucks = truck.goal[2:-2].split('", "')
            actual_trucks_dict = OrderedDict(
                [
                    (1, PLAYER_ID_MAP_RESULTS.get(int(actual_trucks[0]))),
                    (2, PLAYER_ID_MAP_RESULTS.get(int(actual_trucks[1]))),
                    (3, PLAYER_ID_MAP_RESULTS.get(int(actual_trucks[2]))),
                    (4, PLAYER_ID_MAP_RESULTS.get(int(actual_trucks[3])))]
            )

            if type(route) == type(None):
                return render_template('beautiful_results.html',
                                       error='There was no selected route, please complete the game or start a new '
                                             'one',
                                       title='Results - Error')
            actual_route = route.goal[2:-2].split('", "')
            actual_route_dict = OrderedDict(
                [
                    (PLAYER_ID_MAP_RESULTS.get(1), int(actual_route[0])),
                    (PLAYER_ID_MAP_RESULTS.get(2), int(actual_route[1])),
                    (PLAYER_ID_MAP_RESULTS.get(3), int(actual_route[2])),
                    (PLAYER_ID_MAP_RESULTS.get(4), int(actual_route[3]))

                ])

            actuals = OrderedDict(
                [
                    ('priority', actual_priorities_list),
                    ('destination', actual_destinations_dict),
                    ('trucks', actual_trucks_dict),
                    ('routes', actual_route_dict),
                    ('num-of-moves', not_null_trade_moves)
                ]
            )

            ideal = 0
            if selected_template == 2:
                ideal = IDEAL['mission-1']
            elif selected_template == 3:
                ideal = IDEAL['mission-2']

            content['actual_values'] = actuals
            content['ideal_values'] = ideal

            priority_levenshtein = 10 - laven_dist(actuals["priority"], ideal["priority"])

            destination_levenshtein = 10 - laven_dist([x for x in actuals.get('destination').values()],
                                                      [x for x in ideal.get('destination').values()])

            trucks_levenshtein = 10 - laven_dist([x for x in actuals.get('trucks').values()],
                                                 [x for x in ideal.get('trucks').values()])

            actual_route_values = [x for x in actuals.get('routes').values()]
            ideal_route_values = [x for x in ideal.get('routes').values()]
            route_score = 0
            for i in actual_route_values:
                if i == ideal_route_values[0]:
                    route_score += 2.5

            move_score = (ideal.get("num-of-moves") / actuals.get("num-of-moves")) * 10
            move_score = round(move_score, 1)
            average_score = ((
                                     priority_levenshtein + destination_levenshtein + trucks_levenshtein + route_score + move_score) / 50) * 100
            average_score = round(average_score, 1)
            content['priority_score'] = priority_levenshtein
            content['destination_score'] = destination_levenshtein
            content['truck_score'] = trucks_levenshtein
            content['route_score'] = route_score
            content['moves_score'] = move_score
            content['average_score'] = average_score
            color = ''
            if average_score >= 70:
                color = 'success'
            elif 50 < average_score < 70:
                color = 'warning'
            else:
                color = 'danger'
            pp = pprint.PrettyPrinter(indent=4).pprint
            pp(content)
            return render_template('beautiful_results.html', content=content, title='Results', color=color)
        except Exception as error:
            pp = pprint.PrettyPrinter(indent=4).pprint
            pp(error)
            return render_template('beautiful_results.html', error=error,
                                   title='Results - Error')
    else:
        return render_template('beautiful_results.html', error='No game in session - please start a new game',
                               title='Results - Error')


@app.route('/game/<gameid>', methods=['GET'])
def game(gameid):
    join_room(gameid)

    with app.app_context():
        sess = current_app['sess']

    return render_template('app.html', player_template_json=None, gameid=gameid,
                           sess=json.dumps(sess), view='playerdashboard',
                           is_admin=None)


@app.route('/login', methods=['GET'])
def login():
    return render_template('app.html', player_template_json=None, gameid=None,
                           sess=None, view='player-login', is_admin=None)


@app.route('/admin-login', methods=['GET'])
def admin_login():
    return render_template('app.html', player_template_json=None,
                           gameid=None, sess=None, view="adminlogin",
                           is_admin="admin")


@app.route('/admin', methods=['GET'])
def admin():
    return render_template('app.html', player_template_json=None,
                           gameid=None, sess=None, view="admin",
                           is_admin=None)


@app.route('/num-teams-collected', methods=['GET'])
def num_teams_collected():
    lobby_cnt = nandor.db.engine.execute("select count(distinct game_id) from lobby")

    return render_template('quick-query.html', lobby_cnt=lobby_cnt.fetchone()[0])


@socketio.on('join-game')
def join_game(data):
    if 'gameid' in data:
        lobby_cnt = None
        gameid = data['gameid']

        join_room(gameid)

        with app.app_context():
            sess = current_app.config['sess']
            gamesess = sess[gameid]

            if 'is_admin' in data and data['is_admin']:
                lobby_cnt = nandor.db.engine.execute("select count(distinct game_id) from lobby").fetchone()[0]
                upid = None
                cur_id = 'admin'
            else:
                if 'upid' in data and data['upid'] is not None:
                    upid = data['upid']
                else:
                    upid = secrets.token_urlsafe(config.SESSION_TOKEN_KEY_SIZE)

                if 'upidmap' not in gamesess:
                    gamesess['upidmap'] = {}

                if upid not in gamesess['upidmap']:
                    if 'player_ids' in gamesess:
                        cur_id = gamesess['player_ids'][-1] + 1
                        gamesess['player_ids'].append(cur_id)
                    else:
                        cur_id = 0
                        gamesess['player_ids'] = [cur_id]

                    gamesess['upidmap'][upid] = cur_id
                else:
                    cur_id = gamesess['upidmap'][upid]

            sess['gameid'] = gamesess
            payload = copy.deepcopy(gamesess)

            payload['start_game_time'] = gamesess['time']
            payload['upid'] = upid
            payload['pid'] = cur_id
            payload['routeOrders'] = gamesess['routeOrders']

            player_template = nandor.PlayerTemplate.query.filter_by(template_id=payload['sel_player_template'])

            payload.update({
                'player_template': [p.to_dict() for p in player_template]
            })

            payload['lobby_cnt'] = lobby_cnt

        emit('join-game', json.dumps(payload), json=True)


@socketio.on('resignin-game')
def resignin_game(data):
    if 'gameid' in data:
        gameid = data['gameid']

        join_room(gameid)

        emit('resignin-game', json.dumps({}), json=True)


@socketio.on('propose-deny')
def propose_deny(data):
    if 'gameid' in data:
        gameid = data['gameid']

        with app.app_context():
            sess = current_app.config['sess']
            gamesess = sess[gameid]

            trade_denies = 'trade_denies'
            if trade_denies not in gamesess:
                gamesess[trade_denies] = []

            trade = nandor.Trade(game_id=gameid, time=get_current_utc(),
                                 src_player=PLAYER_ID_MAP[data['player_id_offered']],
                                 src_player_uid='na',
                                 dst_player_uid='na',
                                 offered_resource=data['resource'],
                                 offered_amount=data['offer_amount'])

            nandor.db.session.add(trade)
            nandor.db.session.commit()

            trade_payload = dict(
                offer_amount=data['offer_amount'],
                resource=data['resource'],
                player_id_offered=data['player_id_offered'],
                trade_id=data['trade_id'])

            gamesess[trade_denies].append(trade_payload)

        emit('propose-deny', json.dumps(trade_payload), json=True, room=gameid)


@socketio.on('propose-trade')
def propose_trade(data):
    if 'gameid' in data:
        gameid = data['gameid']

        with app.app_context():
            sess = current_app.config['sess']
            gamesess = sess[gameid]

            trade_req_id = secrets.token_urlsafe(config.TRADE_KEY_SIZE)

            trade_reqs = 'trade_requests'
            if trade_reqs not in gamesess:
                gamesess[trade_reqs] = []

            trade_id = trade_req_id + f'{len(gamesess[trade_reqs])}'
            gamesess['trade'] = {
                trade_id: False
            }

            trade_payload = dict(
                offer_amount=data['offer_amount'],
                resource=data['resource'],
                player_id_offered=data['player_id_offered'],
                trade_id=trade_id,
                trade_expire=data['trade_expire']
            )

            gamesess[trade_reqs].append(trade_payload)

        emit('propose-trade', json.dumps(trade_payload), json=True, room=gameid)


@socketio.on('propose-resource')
def propose_resource(data):
    if 'gameid' in data:
        gameid = data['gameid']
        player_id = data['player_id']
        res_choices = data['choices']

        with app.app_context():
            sess = current_app.config['sess']
            gamesess = sess[gameid]
            gamesess[player_id + '_choices'] = res_choices

            goals = nandor.Goals(game_id=gameid, time=time.time(),
                                 src_player=PLAYER_ID_MAP[player_id], src_player_uid=data['upid'],
                                 goal=json.dumps(res_choices))
            nandor.db.session.add(goals)
            nandor.db.session.commit()

        data = dict(
            gameid=gameid,
            player_id=player_id,
            res_choices=res_choices
        )

        emit('propose-resource', json.dumps(data), json=True, room=gameid)


@socketio.on('trade-accept')
def propose_resource(data):
    if 'gameid' in data:
        with app.app_context():
            gameid = data['gameid']
            sess = current_app.config['sess']
            gamesess = sess[gameid]
            trade_id = data['trade_id']

            if trade_id in gamesess['trade'] and gamesess['trade'][trade_id]:
                emit('trade-already-taken', json.dumps(data), json=True, room=gameid)
            else:
                gamesess['trade'][trade_id] = True

                player_id_accepted = data['player_id_accepted']
                player_id_offered = data['player_id_offered']
                offer_amount = data['offer_amount']
                resource = data['resource']

                trade = nandor.Trade(game_id=gameid, time=time.time(),
                                     src_player=PLAYER_ID_MAP[player_id_offered],
                                     src_player_uid='na',
                                     dst_player=PLAYER_ID_MAP[player_id_accepted],
                                     dst_player_uid='na',
                                     offered_resource=resource,
                                     offered_amount=offer_amount)

                nandor.db.session.add(trade)
                nandor.db.session.commit()

                data = dict(
                    gameid=gameid,
                    player_id_accepted=player_id_accepted,
                    player_id_offered=player_id_offered,
                    offer_amount=offer_amount,
                    resource=resource,
                    trade_id=trade_id
                )

                emit('trade-accept', json.dumps(data), json=True, room=gameid)
                emit('trade-accept-offer-updt', json.dumps(data), json=True, room=gameid)
                emit('trade-accept-resources-updt', json.dumps(data), json=True, room=gameid)


@socketio.on('create-new-game')
def create_new_game(data):
    if len(data) > 0:
        gameid = secrets.token_urlsafe(config.SESSION_TOKEN_KEY_SIZE)

        with app.app_context():
            p_template_id = data['sel_player_template']
            sess = current_app.config['sess']
            condition_num = data['condition_num'],
            sess[gameid] = dict(
                gameid=gameid,
                change_token=secrets.token_urlsafe(config.SESSION_TOKEN_KEY_SIZE),
                time=data['time'],
                trades=data['trades'],
                condition_num=condition_num,
                sel_player_template=p_template_id
            )

            pt = nandor.PlayerTemplate.query.filter_by(template_id=p_template_id).first()

            lobby = nandor.Lobby(game_id=gameid, template_id=data['sel_player_template'],
                                 n_trades=data['trades'], start_time=time.time(), max_duration=data['time'],
                                 route_orders=pt.route_orders, condition_num=condition_num)

            nandor.db.session.add(lobby)
            nandor.db.session.commit()

            sess[gameid]['routeOrders'] = json.loads(pt.route_orders)

        emit('create-new-game', json.dumps(sess[gameid]), json=True)


@socketio.on('start-game')
def start_game(data):
    if 'gameid' in data:
        gameid = data['gameid']

        with app.app_context():
            sess = current_app.config['sess']
            gamesess = sess[gameid]
            gamesess['gametime_end'] = get_current_utc() + gamesess['time']

        emit('start-game', json.dumps(gamesess), json=True, room=gameid)


@socketio.on('stop-game')
def stop_game(data):
    if 'gameid' in data:
        gameid = data['gameid']

        lobby = nandor.Lobby.query.filter_by(game_id=gameid).first()
        nandor.db.session.add(lobby)
        nandor.db.session.commit()

        with app.app_context():
            sess = current_app.config['sess']
            gamesess = sess[gameid]
            gamesess['gametime-end'] = None

        emit('stop-game', json.dumps(gamesess), json=True, room=gameid)


@app.route('/trade', methods=['POST'])
def trade():
    return 'trading'
