from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects import mysql
import config

db = SQLAlchemy(config.app)


class Lobby(db.Model):
    __tablename__ = 'lobby'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    game_id = db.Column(mysql.VARCHAR(100), unique=True, nullable=False)
    gametime = db.Column(db.Integer, unique=False, nullable=True)
    template_id = db.Column(db.Integer, unique=False, nullable=False)
    n_trades = db.Column(db.Integer, unique=False, nullable=False, default=25)
    start_time = db.Column(db.Integer, unique=False, nullable=False, default=0)
    max_duration = db.Column(db.Integer, unique=False, nullable=False, default=500)
    route_orders = db.Column(mysql.VARCHAR(100), unique=False, nullable=False)
    condition_num = db.Column(db.Integer, unique=False, nullable=False)

    def to_dict(self):
        return dict(
            id=self.id,
            game_id=self.game_id,
            gametime=self.gametime,
            template_id=self.template_id,
            n_trades=self.n_trades,
            start_time=self.start_time,
            max_duration=self.max_duration,
            route_orders=self.route_orders,
            condition_num=self.condition_num
        )


class PlayerTemplate(db.Model):
    __tablename__ = 'player_templates'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    template_id = db.Column(db.Integer, unique=False, nullable=False)
    food = db.Column(db.Integer, unique=False, nullable=False)
    water = db.Column(db.Integer, unique=False, nullable=False)
    medicine = db.Column(db.Integer, unique=False, nullable=False)
    supply = db.Column(db.Integer, unique=False, nullable=False)
    name = db.Column(mysql.VARCHAR(45), unique=False, nullable=False)
    dest_need = db.Column(db.Integer, unique=False, nullable=False)
    food_range = db.Column(mysql.VARCHAR(100), unique=False, nullable=True)
    water_range = db.Column(mysql.VARCHAR(100), unique=False, nullable=True)
    medicine_range = db.Column(mysql.VARCHAR(100), unique=False, nullable=True)
    supply_range = db.Column(mysql.VARCHAR(100), unique=False, nullable=True)
    route_orders = db.Column(mysql.VARCHAR(100), unique=False, nullable=False)

    def to_dict(self):
        return dict(
            id=self.id,
            template_id=self.template_id,
            food=self.food,
            water=self.water,
            medicine=self.medicine,
            supply=self.supply,
            name=self.name,
            dest_need=self.dest_need,
            food_range=self.food_range,
            water_range=self.water_range,
            medicine_range=self.medicine_range,
            supply_range=self.supply_range,
            route_orders=self.route_orders
        )


class Goals(db.Model):
    __tablename__ = 'goals'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    game_id = db.Column(mysql.VARCHAR(100), unique=False, nullable=False)
    time = db.Column(db.Integer, unique=False, nullable=False)
    src_player = db.Column(db.Integer, unique=False, nullable=False)
    src_player_uid = db.Column(mysql.VARCHAR(128), unique=False, nullable=False)
    goal = db.Column(mysql.VARCHAR(512), unique=False, nullable=True)

    def to_dict(self):
        return dict(
            id=self.id,
            time=self.time,
            game_id=self.game_id,
            src_player=self.src_player,
            src_player_uid=self.src_player_uid,
            goal=self.goal
        )


class Trade(db.Model):
    __tablename__ = 'trade'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    game_id = db.Column(mysql.VARCHAR(100), unique=False, nullable=False)
    time = db.Column(db.Integer, unique=False, nullable=False)
    src_player = db.Column(db.Integer, unique=False, nullable=False)
    src_player_uid = db.Column(mysql.VARCHAR(128), unique=False, nullable=False)
    dst_player = db.Column(db.Integer, unique=False, nullable=True)
    dst_player_uid = db.Column(mysql.VARCHAR(128), unique=False, nullable=True)
    offered_resource = db.Column(mysql.VARCHAR(45), unique=False, nullable=False)
    offered_amount = db.Column(db.Integer, unique=False, nullable=False)

    def to_dict(self):
        return dict(
            id=self.id,
            time=self.time,
            src_player=self.src_player,
            src_player_uid=self.src_player_uid,
            dst_player=self.dst_player,
            dst_player_uid=self.dst_player_uid,
            offered_resource=self.offered_resource,
            offered_amount=self.offered_amount
        )
