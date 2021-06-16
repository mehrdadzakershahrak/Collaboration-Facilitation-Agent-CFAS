import copy
import json
import os
import pprint
import secrets
import sys
import time
import traceback
from collections import OrderedDict
from datetime import datetime
from difflib import SequenceMatcher

import config
import pytz
from api.v1.model import nandor
from config import app, socketio
from flask import render_template, request
from flask_socketio import emit, join_room
from flask import current_app, redirect, url_for

pp = pprint.PrettyPrinter(indent=4).pprint

PLAYER_ID_MAP_RESULTS = OrderedDict([(1, 'Alpha'),
                                     (2, 'Bravo'),
                                     (3, 'Charlie'),
                                     (4, 'Delta')])

ROUTE_MAP = OrderedDict([('Alpha', 1),
                         ('Bravo', 2),
                         ('Charlie', 3),
                         ('Delta', 4)])

DESTINATION_ID_MAP_RESULTS = OrderedDict([(1, 'Shelter'),
                                          (2, 'Center'),
                                          (3, 'Hospital'),
                                          (4, 'Bridge')]
                                         )

IDEAL = {
    'mission-1': OrderedDict(
        [('priority', ['Bridge', 'Hospital', 'Center', 'Shelter']),
         ('destination', OrderedDict(
             [(DESTINATION_ID_MAP_RESULTS.get(1), PLAYER_ID_MAP_RESULTS.get(4)),
              (DESTINATION_ID_MAP_RESULTS.get(2), PLAYER_ID_MAP_RESULTS.get(3)),
              (DESTINATION_ID_MAP_RESULTS.get(3), PLAYER_ID_MAP_RESULTS.get(2)),
              (DESTINATION_ID_MAP_RESULTS.get(4), PLAYER_ID_MAP_RESULTS.get(1))]
         )),
         ('trucks', OrderedDict(
             [(1, 'Bridge'),
              (2, 'Hospital'),
              (3, 'Center'),
              (4, 'Shelter')]
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
        ('priority', ['Bridge', 'Shelter', 'Center', 'Hospital']),
        ('destination', OrderedDict(
            [(DESTINATION_ID_MAP_RESULTS.get(1), PLAYER_ID_MAP_RESULTS.get(2)),
             (DESTINATION_ID_MAP_RESULTS.get(2), PLAYER_ID_MAP_RESULTS.get(1)),
             (DESTINATION_ID_MAP_RESULTS.get(3), PLAYER_ID_MAP_RESULTS.get(4)),
             (DESTINATION_ID_MAP_RESULTS.get(4), PLAYER_ID_MAP_RESULTS.get(3))]
        )),
        ('trucks', OrderedDict(
            [(1, 'Center'),
             (2, 'Shelter'),
             (3, 'Hospital'),
             (4, 'Bridge')]
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


def get_sequence_matcher_score(list_a: list, list_b: list) -> int:
    try:
        score = 0
        print(list_a, list_b)

        list_a_string = ''
        list_b_string = ''
        for i in list_a:
            list_a_string += i[0]

        for i in list_b:
            list_b_string += i[0]
        print(list_a_string, list_b_string)
        score = SequenceMatcher(None, list_a_string, list_b_string).ratio()*10
        print(score)
        return score
    except Exception as error:
        raise Exception(f'Error in Get Score - {type(list_a)}, {type(list_b)}')


def get_score(list_a: list, list_b: list) -> int:
    try:
        score = 0
        # print(list_a, list_b)
        for (x, y) in zip(list_a, list_b):
            if x == y:
                score += 2.5
        return score
    except Exception as error:
        raise Exception(f'Error in Get Score - {type(list_a)}, {type(list_b)}')


def get_move_score(am: int, im: int) -> float:
    if am < im:
        move_score = round((am / im) * 10, 1)
    else:
        move_score = round((im / am) * 10, 1)
    return move_score


def calculate_score(actuals, ideal) -> tuple:
    # priority score
    list_actuals_priority = actuals.get('priority')
    list_ideals_priority = ideal.get('priority')

    # to change back to the one to one score mapping comment and uncomment the function between getscore & getsequencematcher functions

    priority_score = get_sequence_matcher_score(list_actuals_priority, list_ideals_priority) # sequence matcher function
    # priority_score = get_score(list_actuals_priority, list_ideals_priority) # one to one mapping

    # destination score
    list_actuals_destination = [x for x in actuals.get('destination').values()]
    list_ideals_destination = [x for x in ideal.get('destination').values()]

    # print(list_actuals_destination, list_ideals_destination)

    destination_score = get_sequence_matcher_score(list_actuals_destination, list_ideals_destination) # sequence matcher function
    # destination_score = get_score(list_actuals_destination, list_ideals_destination) # one to one mapping



    # truck score
    list_actuals_trucks = [x for x in actuals.get('trucks').values()]
    list_ideals_trucks = [x for x in ideal.get('trucks').values()]

    truck_score = get_score(list_actuals_trucks, list_ideals_trucks)

    # route score
    list_actual_route = [x for x in actuals.get('routes').values()]
    list_ideal_route = [x for x in ideal.get('routes').values()]

    route_score = get_score(list_actual_route, list_ideal_route)

    # move score
    im = ideal.get("num-of-moves")
    am = actuals.get("num-of-moves")
    move_score = get_move_score(am, im)
    avg_score = get_average_score(priority_score, destination_score, truck_score, route_score, move_score)
    return priority_score, destination_score, truck_score, route_score, move_score, avg_score


def get_average_score(priority_score: float, destination_score: float, truck_score: float, route_score: float,
                      move_score: float) -> float:
    # average score
    avg_score = (priority_score + destination_score + truck_score + route_score + move_score) * 2
    # sum /50 * 100
    return avg_score


@app.route('/results', methods=['POST', 'GET'])
def results_with_game_id():
    try:
        if request.method == 'GET':
            return render_template('input_game_id.html', title='Results')
        elif request.method == 'POST':
            game_id = request.form.get('game_id')
            sess = current_app.config['sess']
            content = OrderedDict()
            try:
                selected_template = nandor.db.engine.execute(
                    f"SELECT template_id as tid FROM EXP.lobby where game_id = '{game_id}' limit 1").fetchone().items()[
                    0][1]


            except Exception as error:
                raise Exception('Selected Template Not Found ==> ' + str(error))
            # selected_template = 2

            content['game_id'] = game_id
            content['select_template'] = selected_template

            # return a list of trades with game id = game | from nandor.py read Class Trade for info
            try:
                all_trade_moves = nandor.Trade.query.filter_by(game_id=game_id)
                not_null_trade_moves = len([x for x in all_trade_moves if x.dst_player is not None])
                if not_null_trade_moves == 0:
                    raise Exception(
                        f'\nThere are no minimum moves played by the player - Number of actual moves = {not_null_trade_moves} ')
            except Exception as error:
                raise Exception('\nFailed to fetch trade moves from the trade table  ==> ' + str(error))

            priorities = nandor.db.engine.execute(
                f"SELECT goal FROM EXP.goals where game_id = '{game_id}' AND SRC_PLAYER = 0 order by time DESC limit 1;").fetchone()

            if type(priorities) == type(None):
                raise Exception('There was no selected priority, please complete the game or start a new one')

            destinations = nandor.db.engine.execute(
                f"SELECT goal FROM EXP.goals where game_id = '{game_id}' AND SRC_PLAYER = 1 order by time DESC limit 1;").fetchone()

            if type(destinations) == type(None):
                raise Exception('There was no selected destination, please complete the game or start a new one')

            truck = nandor.db.engine.execute(
                f"SELECT goal FROM EXP.goals where game_id = '{game_id}' AND SRC_PLAYER = 2 order by time DESC limit 1;").fetchone()

            if type(truck) == type(None):
                raise Exception('There was no selected truck, please complete the game or start a new one')

            route = nandor.db.engine.execute(
                f"SELECT goal FROM EXP.goals where game_id = '{game_id}' AND SRC_PLAYER = 3 order by time DESC limit 1;").fetchone()

            if type(route) == type(None):
                raise Exception('There was no selected route, please complete the game or start a new one')

            try:
                actual_priorities_list = priorities.goal.replace('["', '').replace('"]', '').replace('", "',
                                                                                                     ' ').replace(
                    "Distribution ", "").split(" ")
                # actual_priorities_list = [int(x) for x in actual_priorities_list]
            #     [ '1', '2', '3', '4' ] [1,2,3,4]
            except Exception as error:
                raise Exception('Failed to convert priority to list values ==> ' + str(error))

            try:
                actual_destinations = destinations.goal.replace('["', '').replace('"]', '').replace('", "', ' ').split(
                    " ")
            except Exception as error:
                raise Exception('Failed to convert destinations to list values ==> ' + str(error))

            try:
                actual_destinations_dict = OrderedDict(
                    [
                        (DESTINATION_ID_MAP_RESULTS.get(1), PLAYER_ID_MAP_RESULTS.get(int(actual_destinations[0]))),
                        (DESTINATION_ID_MAP_RESULTS.get(2), PLAYER_ID_MAP_RESULTS.get(int(actual_destinations[1]))),
                        (DESTINATION_ID_MAP_RESULTS.get(3), PLAYER_ID_MAP_RESULTS.get(int(actual_destinations[2]))),
                        (DESTINATION_ID_MAP_RESULTS.get(4), PLAYER_ID_MAP_RESULTS.get(int(actual_destinations[3])))
                    ]
                )
            except Exception as error:
                raise Exception('Failed to created the actual destinations dictionary ==> ' + str(error))

            try:
                actual_trucks = truck.goal.replace('["', '').replace('"]', '').replace('", "', ' ').split(" ")
            except Exception as error:
                raise Exception('Failed to convert trucks to list values ==> ' + str(error))

            try:
                dest_keys = list(actual_destinations_dict.keys())
                dest_vals = list(actual_destinations_dict.values())
                actual_trucks_dict = OrderedDict(
                    [
                        (1, dest_keys[dest_vals.index(PLAYER_ID_MAP_RESULTS.get(int(actual_trucks[0])))]),
                        (2, dest_keys[dest_vals.index(PLAYER_ID_MAP_RESULTS.get(int(actual_trucks[1])))]),
                        (3, dest_keys[dest_vals.index(PLAYER_ID_MAP_RESULTS.get(int(actual_trucks[2])))]),
                        (4, dest_keys[dest_vals.index(PLAYER_ID_MAP_RESULTS.get(int(actual_trucks[3])))])
                    ]
                )
            except Exception as error:
                raise Exception('Failed to created the actual trucks dictionary ==> ' + str(error))

            try:
                actual_route = route.goal.replace('["', '').replace('"]', '').replace('", "', ' ').split(" ")
            except Exception as error:
                raise Exception('Failed to convert route to list values ==> ' + str(error))

            try:
                actual_route_dict = OrderedDict(
                    [
                        (PLAYER_ID_MAP_RESULTS.get(1), int(actual_route[0])),
                        (PLAYER_ID_MAP_RESULTS.get(2), int(actual_route[1])),
                        (PLAYER_ID_MAP_RESULTS.get(3), int(actual_route[2])),
                        (PLAYER_ID_MAP_RESULTS.get(4), int(actual_route[3]))
                    ])
            except Exception as error:
                raise Exception('Failed to created the actual route  dictionary ==> ' + str(error))
            try:
                actuals = OrderedDict(
                    [
                        ('priority', actual_priorities_list),
                        ('destination', actual_destinations_dict),
                        ('trucks', actual_trucks_dict),
                        ('routes', actual_route_dict),
                        ('num-of-moves', not_null_trade_moves)
                    ]
                )

            except Exception as error:
                raise Exception('Failed to created the final actuals dictionary ==> ' + str(error))

            ideal = {}
            try:
                if selected_template == 3:
                    ideal = IDEAL['mission-2']
                else:
                    ideal = IDEAL['mission-1']
            except Exception as error:
                raise Exception('Failed to fetch the Ideal mission steps ==> ' + str(error))

            content['actual_values'] = actuals
            content['ideal_values'] = ideal
            p_score, d_score, t_score, r_score, m_score, avg_score = calculate_score(content.get('actual_values'),
                                                                                     content.get('ideal_values'))

            content['priority_score'] = p_score
            content['destination_score'] = d_score
            content['truck_score'] = t_score
            content['route_score'] = r_score
            content['moves_score'] = m_score
            content['average_score'] = avg_score

            color = ''
            if avg_score >= 70:
                color = 'success'
                sess['score_range'] = 'High'
            elif 50 < avg_score < 70:
                color = 'warning'
                sess['score_range'] = 'Medium'
            else:
                color = 'danger'
                sess['score_range'] = 'Low'

            # pp(content)
            return render_template('beautiful_results.html', content=content, title='Results', color=color)
        else:
            return redirect('results')
    except Exception as e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        file_name = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        error = {'class': exc_type, 'file': file_name, 'line': exc_tb.tb_lineno, 'message': e}
        pp(error)
        return render_template('beautiful_results.html',
                               error=error,
                               title='Results - Error')


Decision_mapping = {0: "Priority", 1: "Dest\n(Sh-Ce-Ho-Br)", 2: "Truck", 3: "Route"}


def rewards_goals_json(num_of_moves: int, src_player_id: str, src_player_name: str, action_goal: str,
                       priority: str, destination: str, trucks: str, routes: list,
                       p_score: float, d_score: float, t_score: float, r_score: float, m_score: float,
                       avg_score: float) -> dict:
    return {
        'num_of_moves': num_of_moves,
        'src_player_id': src_player_id,
        'src_player_name': src_player_name,
        'Goal': action_goal,
        'priority': priority,
        'destination': destination,
        'trucks': trucks,
        'routes': routes,
        'p_score': p_score,
        'd_score': d_score,
        't_score': t_score,
        'r_score': r_score,
        'm_score': m_score,
        'avg_score': avg_score
    }


def rewards_trades_json(src_player_name, dst_player_name, offered_resource, offered_amount,
                        src_food, src_water, src_medicine, src_supply,
                        dst_food, dst_water, dst_medicine, dst_supply,
                        dst_loc_name, dst_loc_food, dst_loc_water, dst_loc_medicine, dst_loc_supply):
    return {'src_player_name': src_player_name,
            'dst_player_name': dst_player_name,
            'offered_resource': offered_resource,
            'offered_amount':offered_amount,
            'src_food': src_food,
            'src_water': src_water,
            'src_medicine': src_medicine,
            'src_supply': src_supply,
            'dst_food': dst_food,
            'dst_water': dst_water,
            'dst_medicine': dst_medicine,
            'dst_supply': dst_supply,
            'dst_loc_name':dst_loc_name,
            'dst_loc_food': dst_loc_food,
            'dst_loc_water': dst_loc_water,
            'dst_loc_medicine': dst_loc_medicine,
            'dst_loc_supply': dst_loc_supply,
            }


def blank_rewards(table_trades):

    row = rewards_trades_json(src_player_name='',
                              dst_player_name='',
                              offered_resource='',
                              offered_amount='',
                              src_food='',
                              src_water='',
                              src_medicine='',
                              src_supply='----',
                              dst_food='',
                              dst_water='',
                              dst_medicine='',
                              dst_supply='',
                              dst_loc_name='', dst_loc_food='', dst_loc_water='', dst_loc_medicine='',
                              dst_loc_supply='')
    table_trades.append(row)
    return table_trades


@app.route('/rewards', methods=['GET', 'POST'])
def fetch_goals():
    try:
        #     if user visits the page for the first time display form page to ask user input of game id
        if request.method == 'GET':
            return render_template('input_game_id.html', title='Rewards')

        #     if a form is submitted then go to post to do the data processing
        elif request.method == 'POST':

            # INITIALIZING VARIABLES & VALUES
            table_results = []

            game_id = request.form.get('game_id')  # game_id = 'ndZA_ZM'
            selected_template = nandor.Lobby.query.filter_by(game_id=game_id).first_or_404().to_dict().get('template_id')  # 3 # direct int value
            # Equivalent to ==> (select top 1 template_id from lobby where game_id=game_id)

            ideal = {}
            ideal = IDEAL['mission-2'] if selected_template == 3 else IDEAL['mission-1']
            # if template = 3 choose mission 2 else for all others choose mission 1 template

            # GOALS TABLE SECTION

            # initializing the table values
            previous_row = rewards_goals_json(num_of_moves=-1, src_player_id='-1', src_player_name='NA',
                                              action_goal='initialize',
                                              priority='0000', destination='0000',
                                              trucks='0000', routes=[0, 0, 0, 0],
                                              p_score=0, d_score=0, t_score=0, r_score=0, m_score=0, avg_score=0)

            table_results.append(previous_row)
            # print(previous_row)

            goals = nandor.Goals.query.filter_by(game_id=game_id).order_by(nandor.Goals.time).all()
            # list of all rows for the current game from the goals table
            # Equivalent to ==> select * from goals where game_id=game_id order by time

            all_trade_count = nandor.Trade.query.filter_by(game_id=game_id).filter(nandor.Trade.dst_player != None).count()
            trade_count = 0

            p_score, d_score, t_score, r_score, m_score = 0, 0, 0, 0, 0
            avg_score, priority, destination, trucks, routes = 0, 0, 0, 0, 0

            for goal in goals:
                results = goal.rewards()
                trade_count = nandor.Trade.query.filter_by(game_id=game_id).filter(nandor.Trade.dst_player != None).filter(nandor.Trade.time < results.get('time')).count()

                p_score = previous_row.get('p_score')
                d_score = previous_row.get('d_score')
                t_score = previous_row.get('t_score')
                r_score = previous_row.get('r_score')
                m_score = get_move_score(trade_count, ideal.get('num-of-moves'))
                # print(m_score)
                avg_score = previous_row.get('avg_score')
                priority = previous_row.get('priority')
                destination = previous_row.get('destination')
                trucks = previous_row.get('trucks')
                routes = previous_row.get('routes')

                if results.get('src_player_id') == 0:
                    p_score = get_score(results.get('goal'), ideal.get('priority'))
                    priority = results.get('goal')
                elif results.get('src_player_id') == 1:
                    d_score = get_score(results.get('goal'), [x for x in ideal.get('destination').values()])
                    destination = results.get('goal')
                elif results.get('src_player_id') == 2:
                    t_score = get_score(results.get('goal'), [x for x in ideal.get('trucks').values()])
                    trucks = results.get('goal')
                elif results.get('src_player_id') == 3:
                    # print(results.get('goal'))
                    routes = [ROUTE_MAP.get(x) for x in results.get('goal')]
                    # print(routes)
                    results['goal'] = routes
                    r_score = get_score(routes, [x for x in ideal.get('routes').values()])

                avg_score = get_average_score(p_score, d_score, t_score, r_score, m_score)

                previous_row = rewards_goals_json(num_of_moves=trade_count,
                                                  src_player_id=Decision_mapping.get(results.get('src_player_id')),
                                                  src_player_name=results.get('src_player_name'),
                                                  action_goal="-".join([str(x)[0] for x in results.get('goal')]),
                                                  priority="".join([x[0] for x in priority]),
                                                  destination="".join([x[0] for x in destination]),
                                                  trucks="".join([x[0] for x in trucks]),
                                                  routes=routes,
                                                  p_score=p_score, d_score=d_score, t_score=t_score, r_score=r_score, m_score=m_score,
                                                  avg_score=avg_score)

                table_results.append(previous_row)
                # print(previous_row)
            if all_trade_count > trade_count:
                m_score = get_move_score(all_trade_count, ideal.get('num-of-moves'))
                avg_score = get_average_score(p_score, d_score, t_score, r_score, m_score)
                previous_row = rewards_goals_json(num_of_moves=all_trade_count, src_player_id="Final trades",
                                                  src_player_name=results.get('src_player_name'),
                                                  action_goal="Final trades",
                                                  priority="".join([x[0] for x in priority]),
                                                  destination="".join([x[0] for x in destination]),
                                                  trucks="".join([x[0] for x in trucks]),
                                                  routes=routes,
                                                  p_score=p_score, d_score=d_score, t_score=t_score, r_score=r_score, m_score=m_score,
                                                  avg_score=avg_score)

                table_results.append(previous_row)


            # TRADES TABLE SECTION

            #  initial resource at start of game
            player_a_resource = nandor.PlayerTemplate.query.filter_by(template_id=selected_template).filter_by(name='A').first().player_resource_values()
            player_b_resource = nandor.PlayerTemplate.query.filter_by(template_id=selected_template).filter_by(name='B').first().player_resource_values()
            player_c_resource = nandor.PlayerTemplate.query.filter_by(template_id=selected_template).filter_by(name='C').first().player_resource_values()
            player_d_resource = nandor.PlayerTemplate.query.filter_by(template_id=selected_template).filter_by(name='D').first().player_resource_values()

            player_resource = {
                0: player_a_resource,
                1: player_b_resource,
                2: player_c_resource,
                3: player_d_resource
            }

            print(f'A = {player_a_resource}')
            print(f'B = {player_b_resource}')
            print(f'C = {player_c_resource}')
            print(f'D = {player_d_resource}')

            dest_shelter_resource   = nandor.PlayerTemplate.query.filter_by(template_id=selected_template).filter_by(name='Shelter').first().destination_resource_values()
            dest_bridge_resource    = nandor.PlayerTemplate.query.filter_by(template_id=selected_template).filter_by(name='Bridge').first().destination_resource_values()
            dest_hospital_resource  = nandor.PlayerTemplate.query.filter_by(template_id=selected_template).filter_by(name='Hospital').first().destination_resource_values()
            dest_center_resource    = nandor.PlayerTemplate.query.filter_by(template_id=selected_template).filter_by(name='Distribution Center').first().destination_resource_values()

            dest_resource = {
                0: dest_shelter_resource,
                1: dest_center_resource,
                2: dest_hospital_resource,
                3: dest_bridge_resource
            }
            print()
            print(f'Shelter = {dest_shelter_resource}')
            print(f'Bridge = {dest_bridge_resource}')
            print(f'Hospital = {dest_hospital_resource}')
            print(f'Center = {dest_center_resource}')

            print()
            table_trades = []
            for i in range(4):
                row = rewards_trades_json(src_player_name=PLAYER_ID_MAP_RESULTS.get(i+1),
                                          dst_player_name='',
                                          offered_resource='',
                                          offered_amount='',
                                          src_food=player_resource.get(i).get('food'),
                                          src_water=player_resource.get(i).get('water'),
                                          src_medicine=player_resource.get(i).get('medicine'),
                                          src_supply=player_resource.get(i).get('supply'),
                                          dst_food='',
                                          dst_water='',
                                          dst_medicine='',
                                          dst_supply='',
                                          dst_loc_name='', dst_loc_food='', dst_loc_water='', dst_loc_medicine='', dst_loc_supply='')
                table_trades.append(row)

            for i in range(4):
                row = rewards_trades_json(src_player_name='',
                                          dst_player_name=DESTINATION_ID_MAP_RESULTS.get(i+1),
                                          offered_resource='',
                                          offered_amount='',
                                          src_food='',
                                          src_water='',
                                          src_medicine='',
                                          src_supply='',
                                          dst_food=dest_resource.get(i).get('food'),
                                          dst_water=dest_resource.get(i).get('water'),
                                          dst_medicine=dest_resource.get(i).get('medicine'),
                                          dst_supply=dest_resource.get(i).get('supply'),
                                          dst_loc_name='', dst_loc_food='', dst_loc_water='', dst_loc_medicine='', dst_loc_supply='')
                table_trades.append(row)
            table_trades = blank_rewards(table_trades)
            table_trades = blank_rewards(table_trades)
            trades_all = nandor.Trade.query.filter_by(game_id=game_id).order_by(nandor.Trade.time).filter(nandor.Trade.dst_player != None).all()
            for trade in trades_all:
                # print(trade.to_dict())
                #  fetch the current priority assignment

                trade = trade.rewards()
                time_stamp = trade.get('time')

                destination_sequence = nandor.Goals.query.filter_by(src_player=1).filter_by(game_id=game_id).filter(nandor.Goals.time < time_stamp).order_by(nandor.Goals.time.desc()).first().to_dict().get('goal')
                print(destination_sequence)

                src_dst_mapping = {}

                src_player_id = trade.get('src_player')
                src_player_name = PLAYER_ID_MAP_RESULTS.get(src_player_id + 1)

                dst_player_id = trade.get('dst_player')
                dst_player_name = PLAYER_ID_MAP_RESULTS.get(dst_player_id + 1)

                t_amount = trade.get('offered_amount')
                t_resource = trade.get('offered_resource')

                # print(f"{src_player_name} --> {dst_player_name}\t{t_amount}\t{t_resource.rjust(8)}")

                row = rewards_trades_json(src_player_name=src_player_name,
                                          dst_player_name=dst_player_name,
                                          offered_resource=t_resource,
                                          offered_amount=t_amount,
                                          src_food='',
                                          src_water='',
                                          src_medicine='',
                                          src_supply='',
                                          dst_food='',
                                          dst_water='',
                                          dst_medicine='',
                                          dst_supply='',
                                          dst_loc_name='', dst_loc_food='', dst_loc_water='', dst_loc_medicine='', dst_loc_supply='')

                old_src_value = player_resource[src_player_id][t_resource]
                old_dst_value = player_resource[dst_player_id][t_resource]

                player_resource[src_player_id][t_resource] -= t_amount
                player_resource[dst_player_id][t_resource] += t_amount

                row['src_'+t_resource] = player_resource[src_player_id][t_resource]
                row['dst_' + t_resource] = player_resource[dst_player_id][t_resource]

                # dest_resource = {
                #     0: dest_shelter_resource,
                #     1: dest_center_resource,
                #     2: dest_hospital_resource,
                #     3: dest_bridge_resource
                # }

                print(dst_player_id+1, dst_player_name, destination_sequence)

                destination_location_name = destination_sequence.index(dst_player_id+1)
                print(f'{dst_player_name} will go to {destination_location_name} - {dest_resource.get(destination_location_name).get("name")} -  SCHB'
                      f'{dest_resource.get(destination_location_name)}')

                destination_location_resources = dest_resource.get(destination_location_name)
                print(destination_location_resources)

                row['dst_loc_name'] = destination_location_resources.get('name').replace("Distribution ","")
                row['dst_loc_food'] = player_resource.get(dst_player_id).get('food') - destination_location_resources.get('food')
                row['dst_loc_water'] = player_resource.get(dst_player_id).get('water') - destination_location_resources.get('water')
                row['dst_loc_medicine'] = player_resource.get(dst_player_id).get('medicine') - destination_location_resources.get('medicine')
                row['dst_loc_supply'] = player_resource.get(dst_player_id).get('supply') - destination_location_resources.get('supply')

                table_trades.append(row)
            table_trades = blank_rewards(table_trades)
            table_trades = blank_rewards(table_trades)

            for i in range(4):
                player = PLAYER_ID_MAP_RESULTS.get(destination_sequence[i])
                row = rewards_trades_json(src_player_name=f'{player}--->',
                                          dst_player_name=DESTINATION_ID_MAP_RESULTS.get(i+1),
                                          offered_resource='',
                                          offered_amount='',
                                          src_food=f'{player_resource.get(destination_sequence[i]-1).get("food")}',
                                          src_water=f'{player_resource.get(destination_sequence[i]-1).get("water")}',
                                          src_medicine=f'{player_resource.get(destination_sequence[i]-1).get("medicine")}',
                                          src_supply=f'{player_resource.get(destination_sequence[i]-1).get("supply")}',
                                          dst_food=dest_resource.get(i).get('food'),
                                          dst_water=dest_resource.get(i).get('water'),
                                          dst_medicine=dest_resource.get(i).get('medicine'),
                                          dst_supply=dest_resource.get(i).get('supply'),
                                          dst_loc_name='', dst_loc_food='', dst_loc_water='', dst_loc_medicine='', dst_loc_supply='')
                table_trades.append(row)

            return render_template('beautiful_rewards.html', table_results=table_results, ideals=ideal, table_trades=table_trades)
        else:
            return redirect('fetch_goals')
    except Exception as e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        file_name = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        error = {'class': exc_type, 'file': file_name, 'line': exc_tb.tb_lineno, 'message': e}
        pp(error)
        return render_template('beautiful_rewards.html',
                               error=error,
                               title='Fetch - Error')


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


# user propose --> socket.emit --> socket.on(catch here {do funciton})
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
