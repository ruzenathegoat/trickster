<?php
$teams = DB::table("teams")->select("name", "logo_url")->whereRaw("LOWER(name) LIKE '%fnatic%'")->get();
echo json_encode($teams, JSON_PRETTY_PRINT);
