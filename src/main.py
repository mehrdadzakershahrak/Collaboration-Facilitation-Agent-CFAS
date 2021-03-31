import config; config.init_app()
from api.v1.controller import game_controller


app = config.app


def main():
    config.socketio.run(app=config.app,
                        host='0.0.0.0',
                        port=config.PORT,
                        debug=config.DEBUG_MODE)


if __name__ == '__main__':
    main()
