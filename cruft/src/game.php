<?php
    session_start();
    require_once("db.php");
    require_once("player.php");

    class Game {
        private $database             = NULL;
        private $players              = NULL;
        private $lobby_id             = 0;
        private $num_traids_remaining = 0;
        private $error_msg            = "";
        private $time_remaining       = 0;
        
        function __construct() {
            $this->database = new Database();

            if (isset($_SESSION["lid"])) {
                $this->lobby_id = $_SESSION["lid"];
            }

            $this->loadPlayersInLobby();
        }
    
        function __destruct() {

        }

        private function loadPlayersInLobby() {
            $this->players = array(new Player());
            if ($this->lobby_id !== 0) {
                $sql = "SELECT player_1, player_2, player_3, player_4, n_trades, start_time, max_duration FROM EXP.lobby WHERE id=".$this->lobby_id;
                $res = $this->database->query($sql);
                if ($res->num_rows != 1) {
                    $this->error_msg = "Fatal server error 0x0002";
                }
                $row  = $res->fetch_assoc();
                $pids = array($row["player_1"], $row["player_2"], $row["player_3"], $row["player_4"]);
                foreach ($pids as &$pid) {
                    if ($pid != $this->players[0]->id && $pid > 0) {
                        array_push($this->players, new Player($pid));
                    }
                }

                $this->num_traids_remaining = $row["n_trades"];
                
                # Start lobby, if not started yet
                if ($row["start_time"] == 0) {
                    $sql = "UPDATE EXP.lobby SET start_time=".time()." WHERE id=".$this->lobby_id;
                    $this->database->query($sql);
                } else {
                    $this->time_remaining = $row["start_time"] + $row["max_duration"] - time();
                }
            }
        }

        private function loadKeyData($key) {
            $sql    = "SELECT lobby_code, player_code FROM EXP.key_tokens WHERE user_key=\"".$key."\"";
            $row    = $this->database->query($sql);
            $result = new stdClass();
            if ($row->num_rows == 1) {
                $row              = $row->fetch_assoc();
                $result->lobby    = $row["lobby_code"];
                $result->template = $row["player_code"];
            } else {
                $result->lobby    = 0;
                $result->template = 0;
            }
            return $result;
        }

        private function addPlayerToLobby($key) {
            $key = $this->loadKeyData($key);
            if ($key->lobby == 0 || $key->template == 0) {
                $this->error_msg = "Invalid Lobby Code";
                $this->players[0]->deletePlayer();
                return;
            }
            $sql = "SELECT * FROM EXP.lobby WHERE id=".$key->lobby;
            $res = $this->database->query($sql);

            # Check if lobby full
            $row  = $res->fetch_assoc();
            $spot = $this->findSpotInLobby($row);
            if ($spot === "") {
                $this->error_msg = "Lobby Full";
                $this->players[0]->deletePlayer();
                return;
            }
            # Update Lobby
            $sql = "UPDATE EXP.lobby SET ".$spot."=".$this->players[0]->id." WHERE id=".$key->lobby;
            $res = $this->database->query($sql);
            $_SESSION["lid"] = $key->lobby;
            
            # Update Player
            $this->players[0]->setLobby($key->lobby);
            
            # Update Player Template
            $sql = "SELECT food, water, medicine, supply FROM EXP.player_templates WHERE id=".$key->template;
            $res = $this->database->query($sql);
            if ($res->num_rows != 1) {
                $this->error_msg = "Fatal server error: 0x0001";
                return;
            }
            $row = $res->fetch_assoc();
            $this->players[0]->setResources($row["food"], $row["water"], $row["medicine"], $row["supply"]);
        }

        private function findSpotInLobby($lobby) {
            if ($lobby["player_1"] == 0) {
                return "player_1";
            }
            if ($lobby["player_2"] == 0) {
                return "player_2";
            }
            if ($lobby["player_3"] == 0) {
                return "player_3";
            }
            if ($lobby["player_4"] == 0) {
                return "player_4";
            }
            return "";
        }

        private function isLobbyReady() {
            if ($this->lobby_id == 0 || count($this->players) < 4) {
                return False;
            }
            return True;
        }

        private function addTrade($trade) {
            $sql = "INSERT INTO EXP.trade (time, src_player, offered_resource, offered_amount, requested_resource, requested_amount, lobby) VALUES (".time().",".$this->players[0]->id.",\"".$trade->offered_resource."\",".$trade->offered_amount.",\"".$trade->requested_resource."\",".$trade->requested_amount.",".$this->lobby_id.");";
            $this->database->query($sql);
        }

        private function validateTransaction($player_id) {
            $tid   = $this->players[$player_id]->current_trade;
            if ($tid == 0) {
                return "Trade expired";
            }
            $trade = $this->loadTradeFromID($this->players[$player_id]->current_trade);
            $src_player_resources = (array) $this->players[$player_id]->getResources();
            $dst_player_resources = (array) $this->players[0]->getResources();

            if ($src_player_resources[strval($trade->offered_resource)] >= $trade->offered_amount && $dst_player_resources[strval($trade->requested_resource)] >= $trade->requested_amount) {
                return "";                    
            }
            return "You can't afford this trade!";
        }

        private function runTrade($player_id) {
            $tid = $this->players[$player_id]->current_trade;
            if ($tid == 0) {
                # Only happens during dsync
                return;
            }
            $trade = $this->loadTradeFromID($this->players[$player_id]->current_trade);

            # Book trade
            $sql   = "UPDATE EXP.trade SET dst_player=".$this->players[0]->id." WHERE id=".$tid;
            $this->database->query($sql);
            $sql   = "UPDATE EXP.lobby SET n_trades=n_trades-1 WHERE id=".$this->lobby_id;
            $this->database->query($sql);
            # Update Players
            $sql = "UPDATE EXP.players SET ".$trade->offered_resource."=".$trade->offered_resource."+".$trade->offered_amount.", ".$trade->requested_resource."=".$trade->requested_resource."-".$trade->requested_amount." WHERE id=".$this->players[0]->id;
            $this->database->query($sql);
            $sql = "UPDATE EXP.players SET ".$trade->requested_resource."=".$trade->requested_resource."+".$trade->requested_amount.", ".$trade->offered_resource."=".$trade->offered_resource."-".$trade->offered_amount." WHERE id=".$this->players[$player_id]->id;
            $this->database->query($sql);
        }

        private function loadTradeFromID($tid) {
            $sql                       = "SELECT * FROM EXP.trade WHERE id=".$tid;
            $row                       = $this->database->query($sql)->fetch_assoc();
            $trade                     = new stdClass();
            $trade->src_player         = $row["src_player"];
            $trade->offered_resource   = $row["offered_resource"];
            $trade->offered_amount     = $row["offered_amount"];
            $trade->requested_resource = $row["requested_resource"];
            $trade->requested_amount   = $row["requested_amount"];
            return $trade;
        }

        public function processInput($input) {
            $json   = json_decode($input);
            $result = new stdClass();

            if ($json->action == "join") {
                session_unset();
                $this->loadPlayersInLobby();
                if ($this->error_msg !== "") {
                    $result->error = $this->error_msg;
                } else {
                    $this->players[0]->setName($json->name);
                    $this->addPlayerToLobby($json->key);
                }
            } else if ($json->action == "propose_trade") {
                $res = $this->players[0]->validateTrade($json);
                if ($res != "") {
                    $this->error_msg = $res;
                } else {
                    $this->addTrade($json);
                    $this->error_msg = "";
                }
            } else if ($json->action == "accept_trade") {
                $res = $this->validateTransaction($json->trade_id);
                $result->debug = $json->trade_id;
                if ($res != "") {
                    $this->error_msg = $res;
                } else {
                    $this->runTrade($json->trade_id);
                }
            } else if ($json->action == "update") {
                $this->players[0]->markActive();
                $result->ready = $this->isLobbyReady();
                
                if ($result->ready) {
                    $result->resources = array();
                    foreach($this->players as $player) {
                        $resources = $player->getResources();
                        array_push($result->resources, array($player->getName(), $resources->food, $resources->water, $resources->medicine, $resources->supply));
                    }
                    $result->remaining_time = $this->time_remaining;
                    $result->remaining_trades = $this->num_traids_remaining;
                    $result->trades = array($this->players[1]->trade_info_string, $this->players[2]->trade_info_string, $this->players[3]->trade_info_string);
                    $result->active_trade = $this->players[0]->hasActiveTrade();
                }
            } else {
                $this->error_msg = "Unknown action ".$json->action;
            }
            $result->error = $this->error_msg;
            return $result;
        }
    }

    $game   = new Game();
    $input  = file_get_contents("php://input");
    $result = new stdClass();
    if ($input) {
        $result = $game->processInput($input);
    } else {
        $result->error = "Invalid user";
    }
    
    echo json_encode($result);
