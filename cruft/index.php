<?php
    session_start();
    require_once("src/player.php");

    $page = file_get_contents("src/lobby.html");
    if (isset($_SESSION["pid"])) {
        $player = new Player($_SESSION["pid"]);
        if ($player->isActive()) {
            $page = file_get_contents("src/game.html");
        }
    }
    echo $page;
?>