<?php 
require_once("db.php");

class Player {
    public $id;
    private $database;
    public $current_trade = 0;
    public $trade_info_string;

    function __construct($pid=0) {   
        $this->database = new Database();
        if ($pid === 0) {
            $this->local = TRUE;
            if (isset($_SESSION["pid"])) {
                $this->id = $_SESSION["pid"];
            } else {
                $this->createPlayer();
            }
        } else {
            $this->id    = intval($pid);
            $this->local = FALSE;
        }
        $this->loadPlayerData($this->id);

    }

    function __destruct() {
    }

    private function loadPlayerData($pid) {
        $tos             = time() - 15;
        $sql             = "SELECT * FROM EXP.trade WHERE dst_player=0 AND time>".$tos." AND src_player=".$this->id;
        $res             = $this->database->query($sql);
        if ($res->num_rows == 1) {
            $row = $res->fetch_assoc();
            $this->current_trade = $row["id"];
            $this->trade_info_string = $this->getName()." offers ".$row["offered_amount"]." ".$row["offered_resource"]." for ".$row["requested_amount"]." ".$row["requested_resource"];
        } else {
            $this->current_trade = 0;
            $this->trade_info_string = "No trade offers at this time!";
        }
    }

    public function validateTrade($trade) {
        if($trade->offered_resource == $trade->requested_resource) {
            return "Can't offer and request the same resource!";
        }
        else if($trade->offered_amount < 0 || $trade->requested_amount < 0) {
            return "Quantities can't be negative";
        }
        else if($trade->offered_amount == 0 && $trade->requested_amount == 0) {
            return "Rejecting empty trade";
        }

        $player_resources = (array) $this->getResources();
        if ($player_resources[strval($trade->offered_resource)] < $trade->offered_amount) {
            return "You can not afford this trade!";
        }

        return "";
    }

    public function hasActiveTrade() {
        if ($this->current_trade > 0) {
            return TRUE;
        }
        return FALSE;
    }
    
    private function createPlayer($force=FALSE) {
        if ($this->id != 0 && !$force) {
            error_log("Player already exists!");
        }
        $sql = "INSERT INTO EXP.players (active, lobby, name) VALUES (".time().", 0, \"\")";
        $res = $this->database->query($sql);
        $this->id = intval($this->database->insertedID());
        $_SESSION["pid"] = $this->id;
    }

    public function setResources($food, $water, $medicine, $supply) {
        $sql = "UPDATE EXP.players SET food=".$food.", water=".$water.", medicine=".$medicine.", supply=".$supply." WHERE id=".$this->id;
        $this->database->query($sql);
    }

    public function setName($name) {
        $sql = "UPDATE EXP.players SET name=\"".$name."\" WHERE id=".$this->id;
        $this->database->query($sql);
    }

    public function getName() {
        $sql = "SELECT name FROM EXP.players WHERE id=".$this->id;
        $row = $this->database->query($sql)->fetch_assoc();
        return $row["name"];
    }

    public function setLobby($lid) {
        $sql = "UPDATE EXP.players SET lobby=".$lid." WHERE id=".$this->id;
        $this->database->query($sql);
    }

    public function markActive() {
        $sql = "UPDATE EXP.players SET active=".time()." WHERE id=".$this->id;
        $this->database->query($sql);
    }

    public function isActive() {
        $sql = "SELECT active FROM EXP.players WHERE id=".$this->id;
        $row = $this->database->query($sql)->fetch_assoc();
        if ($row["active"] + 10 > time()) {
            return True;
        }
        return False;
    }

    public function getResources() {
        $sql = "SELECT food, water, medicine, supply FROM EXP.players WHERE id=".$this->id;
        $row = $this->database->query($sql)->fetch_assoc();
        $result           = new stdClass();
        $result->food     = $row["food"];
        $result->water    = $row["water"];
        $result->medicine = $row["medicine"];
        $result->supply   = $row["supply"];
        return $result;
    }

    public function deletePlayer() {
        $sql = "DELETE FROM EXP.players WHERE id=".$this->id;
        $this->database->query($sql);
    }
    
}