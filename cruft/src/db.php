<?php
    class Database {
        private $host     = "localhost";
        private $username = "elrond";
        private $password = "password";
        private $conn;
        
        function __construct($database=""){
            if (!empty($database)) { 
                $this->database = $database; 
            }
            $this->conn = new mysqli($this->host, $this->username, $this->password);
            if ($this->conn->connect_error) {
                die("Connection failed: " . $this->conn->connect_error);
            }            
        }

        function __destruct(){
            $this->conn->close();
        }

        public function query($sql){
            $result = $this->conn->query($sql);
            if ($result === TRUE) {}
            else {
                error_log($this->conn->error);
                // die();
            }
            return $result;
        }

        public function affected() {
            return $this->conn->affected_rows;
        }

        public function insertedID() {
            return $this->conn->insert_id;
        }
    }
?>
