<?php
    session_start();
    require_once("src/db.php");

    class Admin {
        private $database;

        function __construct(){
            $this->database = new Database();
        }

        function __destruct(){

        }

        private function getPlayerTemplates() {
            $templates = array();
            $template_table = "<tr><th>Name</th><th>Food</th><th>Water</th><th>Medicine</th><th>Supply</th></tr>";
            $sql = "SELECT * FROM EXP.player_templates";
            $res = $this->database->query($sql);
            while ($row = $res->fetch_assoc()) {
                array_push($templates, array($row["id"], $row["name"], $row["food"], $row["water"], $row["medicine"], $row["supply"]));
                $template_table = $template_table."<tr><th>".$row["name"]."</th><td>".$row["food"]."</td><td>".$row["water"]."</td><td>".$row["medicine"]."</td><td>".$row["supply"]."</td></tr>";
            }
            return array($templates, $template_table);
        }

        private function generateToken($lid, $pid) {
            return base_convert($lid, 10, 36).base_convert($pid, 10, 36);
        }

        private function createNewGame($json) {
            # Create Lobby
            $sql = "INSERT INTO EXP.lobby (n_trades, max_duration) VALUES (".$json->n_trades.", ".$json->max_duration.")";
            $res = $this->database->query($sql);
            $lid = intval($this->database->insertedID());
            
            $salt = rand(36,64);
            $t1   = $salt * $json->p1;
            $t2   = $salt * $json->p2;
            $t3   = $salt * $json->p3;
            $t4   = $salt * $json->p4;
            # Actual tokens
            $t1   = $this->generateToken($lid * $salt, $t1);
            $t2   = $this->generateToken($lid * $salt, $t2);
            $t3   = $this->generateToken($lid * $salt, $t3);
            $t4   = $this->generateToken($lid * $salt, $t4);
            $tokens = array($t1, $t2, $t3, $t4);
            $json_tokens = array($json->p1, $json->p2, $json->p3, $json->p4);

            # Add them to the keys
            $keys_added = array();
            for($i=0; $i<count($tokens);$i++) {
                if (!in_array($tokens[$i], $keys_added)) {
                    array_push($keys_added, $tokens[$i]);
                    $sql = "INSERT INTO EXP.key_tokens (user_key, lobby_code, player_code) VALUES (\"".$tokens[$i]."\", ".$lid.", ".$json_tokens[$i].")";
                    $res = $this->database->query($sql);
                }
            }

            return $tokens;
        }

        public function processInput($input) {
            $json   = json_decode($input);
            $result = new stdClass();

            if ($json->action == "update") {
                $tmpl = $this->getPlayerTemplates();
                $result->templates = $tmpl[0];
                $result->template_table = $tmpl[1];
            } else if ($json->action == "create_game") {
                $result->tokens = $this->createNewGame($json);
            }            

            return $result;
        }
    }

    $admin  = new Admin();
    $input  = file_get_contents("php://input");
    $result = "";
    if ($input) {
        $result = $admin->processInput($input);
        $result = json_encode($result);
    } else {
        $result = file_get_contents("src/admin.html");
    }

    echo $result;
?>