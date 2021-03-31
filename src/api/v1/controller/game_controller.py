from flask import render_template
from config import app, socketio
import config
from api.v1.model import nandor
import secrets
from flask_socketio import send, emit, join_room, leave_room
from flask import current_app
import copy
import time
import pytz
from datetime import datetime
import json

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

    return render_template('app.html', player_template_json=player_template_json, gameid=None,
                           sess=None, view='gamesetup', is_admin=None)


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
        gameid = data['gameid']

        join_room(gameid)

        with app.app_context():
            sess = current_app.config['sess']
            gamesess = sess[gameid]

            if 'is_admin' in data and data['is_admin']:
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
