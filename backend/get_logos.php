<?php
$teams = DB::table("teams")->select("name", "logo_url")->whereIn("name", ["Sentinels", "Paper Rex", "LOUD", "Fnatic", "Natus Vincere", "Gen.G Esports", "DRX", "T1"])->get();
echo json_encode($teams, JSON_PRETTY_PRINT);
