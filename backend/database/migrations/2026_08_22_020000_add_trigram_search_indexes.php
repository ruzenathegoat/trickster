<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions');

        DB::statement(
            'CREATE INDEX IF NOT EXISTS players_ign_trgm_idx
             ON public.players USING gin (ign extensions.gin_trgm_ops)'
        );

        DB::statement(
            'CREATE INDEX IF NOT EXISTS players_name_trgm_idx
             ON public.players USING gin (name extensions.gin_trgm_ops)'
        );

        DB::statement(
            'CREATE INDEX IF NOT EXISTS teams_name_trgm_idx
             ON public.teams USING gin (name extensions.gin_trgm_ops)'
        );
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS public.players_ign_trgm_idx');
        DB::statement('DROP INDEX IF EXISTS public.players_name_trgm_idx');
        DB::statement('DROP INDEX IF EXISTS public.teams_name_trgm_idx');
    }
};
