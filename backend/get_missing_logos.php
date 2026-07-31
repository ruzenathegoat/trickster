<?php
$teams = DB::table("teams")->select("name", "logo_url")->where("name", "like", "%Fnatic%")->orWhere("name", "like", "%Gen.G%")->orWhere("name", "like", "%DRX%")->get();
echo json_encode($teams, JSON_PRETTY_PRINT);
