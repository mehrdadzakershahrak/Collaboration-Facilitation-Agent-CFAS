from flask import Flask
import os
from flask_socketio import SocketIO
from flask_session import Session

app = None
socketio = None

API_VERSION = os.getenv('NANDOR_API_VERSION', 1)
DEBUG_MODE = False

STATIC_URL_PATH = f'/view/v{API_VERSION}'
STATIC_FOLDER = f'view{os.sep}v{API_VERSION}'
TEMPLATE_FOLDER = f'view{os.sep}v{API_VERSION}{os.sep}template'

SESSION_TOKEN_KEY_SIZE = 5
TRADE_KEY_SIZE = 20
NUM_PLAYERS = 4

NANDOR_DBCONN = os.getenv('NANDOR_DBCONN', 'mysql://elrond:password@localhost:3306/EXP')  # TODO: DEL ME AFTER DEV

SESSION_SECRET_KEY = 'jklajsdfj890234lknasdflkj8'


def init_app():
    global app, socketio

    app = Flask(__name__,
                static_url_path=STATIC_URL_PATH,
                static_folder=STATIC_FOLDER,
                template_folder=TEMPLATE_FOLDER)

    app.config['SQLALCHEMY_DATABASE_URI'] = NANDOR_DBCONN
    app.config['SECRET_KEY'] = SESSION_SECRET_KEY
    app.config['SESSION_TYPE'] = 'filesystem'

    Session(app)
    socketio = SocketIO(app, manage_session=False)


PORT = os.getenv('NANDOR_PORT', 5000)
TEMPLATE_DIR = f'view{os.sep}v{API_VERSION}template'
