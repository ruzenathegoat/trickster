<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

final class HistoricalMatchContextService
{
    /** @return array<string, int> */
    public function backfillAll(): array
    {
        $exactTeams = $this->inferTeamsFromParserOrder();
        $rosterTeams = $this->inferTeamsFromEventRosters();
        $nearestTeams = $this->inferTeamsFromNearestEventMatch();
        $blockTeams = $this->inferRemainingParserBlocks();
        $roles = $this->backfillRoles();
        $currentTeams = $this->refreshCurrentTeams();

        return [
            'team_context_rows' => $exactTeams + $rosterTeams + $nearestTeams + $blockTeams,
            'exact_parser_rows' => $exactTeams,
            'event_roster_rows' => $rosterTeams,
            'nearest_event_rows' => $nearestTeams,
            'parser_block_rows' => $blockTeams,
            'role_context_rows' => $roles,
            'current_teams_refreshed' => $currentTeams,
        ];
    }

    public function backfillMatch(string $matchId): void
    {
        $this->backfillRoles($matchId);
        $this->refreshCurrentTeams();
    }

    private function inferTeamsFromParserOrder(): int
    {
        if (DB::getDriverName() !== 'pgsql') {
            return 0;
        }

        // ParseMatchJob has always traversed team A's stats table before team
        // B's. Exactly-ten canonical rows therefore provide a deterministic
        // historical roster backfill: first five are A, last five are B.
        return DB::affectingStatement(<<<'SQL'
            WITH ranked_rows AS (
                SELECT
                    pms.id,
                    m.team_a_id,
                    m.team_b_id,
                    ROW_NUMBER() OVER (PARTITION BY pms.match_id ORDER BY pms.id) AS row_number,
                    COUNT(*) OVER (PARTITION BY pms.match_id) AS row_count
                FROM player_map_stats pms
                JOIN maps mp ON mp.id = pms.map_id
                JOIN matches m ON m.id = pms.match_id
                WHERE mp.map_name = 'All Maps'
                  AND pms.team_id_at_match IS NULL
            )
            UPDATE player_map_stats pms
            SET
                team_id_at_match = CASE
                    WHEN ranked_rows.row_number <= 5 THEN ranked_rows.team_a_id
                    ELSE ranked_rows.team_b_id
                END,
                team_context_source = 'inferred_parser_order'
            FROM ranked_rows
            WHERE pms.id = ranked_rows.id
              AND ranked_rows.row_count = 10
        SQL);
    }

    private function inferTeamsFromEventRosters(): int
    {
        if (DB::getDriverName() !== 'pgsql') {
            return 0;
        }

        // Substitution matches can contain 11-12 rows. First reuse a player's
        // unambiguous team from other matches in the same event; this is more
        // reliable than their current roster after transfers.
        return DB::affectingStatement(<<<'SQL'
            WITH roster_counts AS (
                SELECT
                    pms.player_id,
                    m.event_id,
                    pms.team_id_at_match,
                    COUNT(*) AS appearances
                FROM player_map_stats pms
                JOIN maps mp ON mp.id = pms.map_id
                JOIN matches m ON m.id = pms.match_id
                WHERE mp.map_name = 'All Maps'
                  AND pms.team_id_at_match IS NOT NULL
                GROUP BY pms.player_id, m.event_id, pms.team_id_at_match
            ),
            ranked_rosters AS (
                SELECT
                    roster_counts.*,
                    ROW_NUMBER() OVER (
                        PARTITION BY player_id, event_id
                        ORDER BY appearances DESC, team_id_at_match
                    ) AS roster_rank,
                    LEAD(appearances) OVER (
                        PARTITION BY player_id, event_id
                        ORDER BY appearances DESC, team_id_at_match
                    ) AS next_appearances
                FROM roster_counts
            ),
            selected_rosters AS (
                SELECT player_id, event_id, team_id_at_match
                FROM ranked_rosters
                WHERE roster_rank = 1
                  AND (next_appearances IS NULL OR appearances > next_appearances)
            )
            UPDATE player_map_stats pms
            SET
                team_id_at_match = selected_rosters.team_id_at_match,
                team_context_source = 'inferred_event_roster'
            FROM matches m, selected_rosters
            WHERE pms.match_id = m.id
              AND pms.player_id = selected_rosters.player_id
              AND m.event_id = selected_rosters.event_id
              AND pms.team_id_at_match IS NULL
              AND selected_rosters.team_id_at_match IN (m.team_a_id, m.team_b_id)
        SQL);
    }

    private function inferTeamsFromNearestEventMatch(): int
    {
        if (DB::getDriverName() !== 'pgsql') {
            return 0;
        }

        // A transfer or substitute can make the season-wide/current roster
        // misleading. Prefer the closest dated known appearance in this same
        // event, and only accept it if that team is playing the target match.
        return DB::affectingStatement(<<<'SQL'
            WITH candidates AS (
                SELECT
                    target.id AS target_id,
                    known.team_id_at_match,
                    ROW_NUMBER() OVER (
                        PARTITION BY target.id
                        ORDER BY
                            ABS(COALESCE(known_match.match_date, target_match.match_date)
                                - target_match.match_date),
                            known_match.match_date DESC,
                            known.id DESC
                    ) AS candidate_rank
                FROM player_map_stats target
                JOIN maps target_map ON target_map.id = target.map_id
                JOIN matches target_match ON target_match.id = target.match_id
                JOIN player_map_stats known
                  ON known.player_id = target.player_id
                 AND known.team_id_at_match IS NOT NULL
                 AND known.id <> target.id
                JOIN maps known_map
                  ON known_map.id = known.map_id
                 AND known_map.map_name = 'All Maps'
                JOIN matches known_match
                  ON known_match.id = known.match_id
                 AND known_match.event_id = target_match.event_id
                WHERE target_map.map_name = 'All Maps'
                  AND target.team_id_at_match IS NULL
                  AND known.team_id_at_match IN (target_match.team_a_id, target_match.team_b_id)
            ),
            selected AS (
                SELECT target_id, team_id_at_match
                FROM candidates
                WHERE candidate_rank = 1
            )
            UPDATE player_map_stats pms
            SET
                team_id_at_match = selected.team_id_at_match,
                team_context_source = 'inferred_nearest_event_match'
            FROM selected
            WHERE pms.id = selected.target_id
        SQL);
    }

    private function inferRemainingParserBlocks(): int
    {
        if (DB::getDriverName() !== 'pgsql') {
            return 0;
        }

        // ParseMatchJob emits all team-A rows before team-B rows. Once event
        // roster inference supplies anchors for both sides, their transition
        // gives a safe boundary even when substitutions create 11-12 rows.
        return DB::affectingStatement(<<<'SQL'
            WITH ranked_rows AS (
                SELECT
                    pms.id,
                    pms.match_id,
                    pms.team_id_at_match,
                    m.team_a_id,
                    m.team_b_id,
                    ROW_NUMBER() OVER (PARTITION BY pms.match_id ORDER BY pms.id) AS row_number
                FROM player_map_stats pms
                JOIN maps mp ON mp.id = pms.map_id
                JOIN matches m ON m.id = pms.match_id
                WHERE mp.map_name = 'All Maps'
            ),
            boundaries AS (
                SELECT
                    match_id,
                    team_a_id,
                    team_b_id,
                    MAX(row_number) FILTER (WHERE team_id_at_match = team_a_id) AS last_team_a,
                    MIN(row_number) FILTER (WHERE team_id_at_match = team_b_id) AS first_team_b
                FROM ranked_rows
                GROUP BY match_id, team_a_id, team_b_id
            ),
            inferred AS (
                SELECT
                    ranked_rows.id,
                    CASE
                        WHEN ranked_rows.row_number < boundaries.first_team_b THEN boundaries.team_a_id
                        ELSE boundaries.team_b_id
                    END AS inferred_team
                FROM ranked_rows
                JOIN boundaries ON boundaries.match_id = ranked_rows.match_id
                WHERE ranked_rows.team_id_at_match IS NULL
                  AND boundaries.last_team_a IS NOT NULL
                  AND boundaries.first_team_b IS NOT NULL
                  AND boundaries.last_team_a < boundaries.first_team_b
            )
            UPDATE player_map_stats pms
            SET
                team_id_at_match = inferred.inferred_team,
                team_context_source = 'inferred_parser_block'
            FROM inferred
            WHERE pms.id = inferred.id
        SQL);
    }

    private function backfillRoles(?string $matchId = null): int
    {
        if (DB::getDriverName() !== 'pgsql') {
            return 0;
        }

        $matchFilter = $matchId === null ? '' : 'AND pma.match_id = ?';
        $bindings = $matchId === null ? [] : [$matchId];

        $derived = DB::affectingStatement(<<<SQL
            WITH role_counts AS (
                SELECT
                    pma.player_id,
                    pma.match_id,
                    INITCAP(arm.role_name) AS role_name,
                    COUNT(*) AS pick_count
                FROM player_match_agents pma
                JOIN agent_role_maps arm ON LOWER(arm.agent_name) = LOWER(pma.agent_name)
                WHERE 1 = 1 {$matchFilter}
                GROUP BY pma.player_id, pma.match_id, INITCAP(arm.role_name)
            ),
            ranked_roles AS (
                SELECT
                    role_counts.*,
                    COUNT(*) OVER (PARTITION BY player_id, match_id) AS distinct_roles,
                    ROW_NUMBER() OVER (
                        PARTITION BY player_id, match_id
                        ORDER BY pick_count DESC, role_name ASC
                    ) AS role_rank
                FROM role_counts
            ),
            selected_roles AS (
                SELECT
                    player_id,
                    match_id,
                    CASE WHEN distinct_roles > 2 THEN 'Flex' ELSE role_name END AS role_name
                FROM ranked_roles
                WHERE role_rank = 1
            )
            UPDATE player_map_stats pms
            SET
                role_at_match = selected_roles.role_name,
                role_context_source = 'derived_agents'
            FROM selected_roles
            WHERE pms.player_id = selected_roles.player_id
              AND pms.match_id = selected_roles.match_id
              AND (pms.role_at_match IS NULL OR pms.role_context_source <> 'scraped')
        SQL, $bindings);

        $fallbackFilter = $matchId === null ? '' : 'AND pms.match_id = ?';

        return $derived + DB::affectingStatement(<<<SQL
            UPDATE player_map_stats pms
            SET
                role_at_match = COALESCE(p.current_role, 'Flex'),
                role_context_source = 'current_role_fallback'
            FROM players p
            WHERE p.id = pms.player_id
              AND pms.role_at_match IS NULL
              {$fallbackFilter}
        SQL, $bindings);
    }

    private function refreshCurrentTeams(): int
    {
        if (DB::getDriverName() !== 'pgsql') {
            return 0;
        }

        return DB::affectingStatement(<<<'SQL'
            WITH latest_context AS (
                SELECT DISTINCT ON (pms.player_id)
                    pms.player_id,
                    pms.team_id_at_match
                FROM player_map_stats pms
                JOIN maps mp ON mp.id = pms.map_id
                JOIN matches m ON m.id = pms.match_id
                WHERE mp.map_name = 'All Maps'
                  AND pms.team_id_at_match IS NOT NULL
                ORDER BY pms.player_id, m.match_date DESC NULLS LAST, pms.id DESC
            )
            UPDATE players p
            SET team_id = latest_context.team_id_at_match
            FROM latest_context
            WHERE p.id = latest_context.player_id
              AND p.team_id IS DISTINCT FROM latest_context.team_id_at_match
        SQL);
    }
}
