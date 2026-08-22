<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GlobalSearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $query = mb_substr(trim((string) $request->query('q', '')), 0, 80);
        $limit = max(2, min(20, (int) $request->query('limit', 10)));

        if ($query === '') {
            return response()->json(['data' => []]);
        }

        $rows = DB::getDriverName() === 'pgsql'
            ? $this->searchPostgres($query, $limit)
            : $this->searchPortable($query, $limit);

        $results = collect($rows)->map(function (object $row): array {
            if ($row->type === 'players') {
                return [
                    'type' => 'players',
                    'id' => $row->id,
                    'ign' => $row->label,
                    'name' => $row->alternate_label,
                    'photo_url' => $row->image_url,
                    'current_role' => $row->role,
                    'team' => [
                        'name' => $row->secondary_label,
                        'region' => $row->region,
                    ],
                    'relevance' => round((float) $row->relevance, 4),
                ];
            }

            return [
                'type' => 'teams',
                'id' => $row->id,
                'name' => $row->label,
                'logo_url' => $row->image_url,
                'region' => $row->region,
                'relevance' => round((float) $row->relevance, 4),
            ];
        })->values();

        return response()->json(['data' => $results]);
    }

    /**
     * Search players and teams in one PostgreSQL statement. The trigram
     * operators use the GIN indexes created by the accompanying migration.
     * Results are capped per entity type so one category cannot crowd out the
     * other in the headbar preview.
     *
     * @return array<int, object>
     */
    private function searchPostgres(string $query, int $limit): array
    {
        $normalizedQuery = mb_strtolower($query);
        $likePattern = str_replace(
            ['\\', '%', '_'],
            ['\\\\', '\\%', '\\_'],
            $normalizedQuery
        );
        $perTypeLimit = max(1, (int) ceil($limit / 2));

        return DB::select(<<<'SQL'
            WITH search_input AS (
                SELECT ?::text AS query, ?::text AS pattern
            ),
            search_results AS (
                SELECT
                    'players'::text AS type,
                    p.id,
                    p.ign::text AS label,
                    p.name::text AS alternate_label,
                    p.photo_url::text AS image_url,
                    p.current_role::text AS role,
                    COALESCE(t.name, 'Free Agent')::text AS secondary_label,
                    t.region::text AS region,
                    GREATEST(
                        extensions.similarity(p.ign, search_input.query),
                        extensions.similarity(COALESCE(p.name, ''), search_input.query)
                    ) AS relevance,
                    GREATEST(
                        CASE
                            WHEN LOWER(p.ign) = search_input.query THEN 5
                            WHEN p.ign ILIKE search_input.pattern || '%' ESCAPE E'\\' THEN 4
                            WHEN p.ign ILIKE '%' || search_input.pattern || '%' ESCAPE E'\\' THEN 3
                            ELSE 1
                        END,
                        CASE
                            WHEN p.name IS NOT NULL AND LOWER(p.name) = search_input.query THEN 5
                            WHEN p.name ILIKE search_input.pattern || '%' ESCAPE E'\\' THEN 4
                            WHEN p.name ILIKE '%' || search_input.pattern || '%' ESCAPE E'\\' THEN 3
                            ELSE 1
                        END
                    ) AS match_priority
                FROM public.players p
                LEFT JOIN public.teams t ON t.id = p.team_id
                CROSS JOIN search_input
                WHERE
                    p.ign ILIKE '%' || search_input.pattern || '%' ESCAPE E'\\'
                    OR p.name ILIKE '%' || search_input.pattern || '%' ESCAPE E'\\'
                    OR (
                        CHAR_LENGTH(search_input.query) >= 3
                        AND (
                            p.ign OPERATOR(extensions.%) search_input.query
                            OR p.name OPERATOR(extensions.%) search_input.query
                        )
                    )

                UNION ALL

                SELECT
                    'teams'::text AS type,
                    t.id,
                    t.name::text AS label,
                    NULL::text AS alternate_label,
                    t.logo_url::text AS image_url,
                    NULL::text AS role,
                    COALESCE(t.region, 'Unknown')::text AS secondary_label,
                    t.region::text AS region,
                    extensions.similarity(t.name, search_input.query) AS relevance,
                    CASE
                        WHEN LOWER(t.name) = search_input.query THEN 5
                        WHEN t.name ILIKE search_input.pattern || '%' ESCAPE E'\\' THEN 4
                        WHEN t.name ILIKE '%' || search_input.pattern || '%' ESCAPE E'\\' THEN 3
                        ELSE 1
                    END AS match_priority
                FROM public.teams t
                CROSS JOIN search_input
                WHERE
                    t.name ILIKE '%' || search_input.pattern || '%' ESCAPE E'\\'
                    OR (
                        CHAR_LENGTH(search_input.query) >= 3
                        AND t.name OPERATOR(extensions.%) search_input.query
                    )
            ),
            ranked_results AS (
                SELECT
                    search_results.*,
                    ROW_NUMBER() OVER (
                        PARTITION BY type
                        ORDER BY match_priority DESC, relevance DESC, label ASC
                    ) AS type_rank
                FROM search_results
            )
            SELECT
                type,
                id,
                label,
                alternate_label,
                image_url,
                role,
                secondary_label,
                region,
                relevance
            FROM ranked_results
            WHERE type_rank <= ?
            ORDER BY match_priority DESC, relevance DESC, label ASC
            LIMIT ?
        SQL, [$normalizedQuery, $likePattern, $perTypeLimit, $limit]);
    }

    /**
     * Substring-only fallback for SQLite and other local test databases. Both
     * entity queries are still compiled into one UNION ALL statement.
     *
     * @return array<int, object>
     */
    private function searchPortable(string $query, int $limit): array
    {
        $normalizedQuery = mb_strtolower($query);
        $contains = '%'.$normalizedQuery.'%';
        $prefix = $normalizedQuery.'%';

        $players = DB::table('players as p')
            ->leftJoin('teams as t', 't.id', '=', 'p.team_id')
            ->selectRaw("'players' AS type")
            ->addSelect([
                'p.id',
                'p.ign as label',
                'p.name as alternate_label',
                'p.photo_url as image_url',
                'p.current_role as role',
                DB::raw("COALESCE(t.name, 'Free Agent') AS secondary_label"),
                't.region',
            ])
            ->selectRaw('0 AS relevance')
            ->selectRaw(
                'CASE WHEN LOWER(p.ign) = ? THEN 5 WHEN LOWER(p.ign) LIKE ? THEN 4 ELSE 3 END AS match_priority',
                [$normalizedQuery, $prefix]
            )
            ->where(function ($builder) use ($contains) {
                $builder->whereRaw('LOWER(p.ign) LIKE ?', [$contains])
                    ->orWhereRaw('LOWER(p.name) LIKE ?', [$contains]);
            });

        $teams = DB::table('teams as t')
            ->selectRaw("'teams' AS type")
            ->addSelect([
                't.id',
                't.name as label',
                DB::raw('NULL AS alternate_label'),
                't.logo_url as image_url',
                DB::raw('NULL AS role'),
                DB::raw("COALESCE(t.region, 'Unknown') AS secondary_label"),
                't.region',
            ])
            ->selectRaw('0 AS relevance')
            ->selectRaw(
                'CASE WHEN LOWER(t.name) = ? THEN 5 WHEN LOWER(t.name) LIKE ? THEN 4 ELSE 3 END AS match_priority',
                [$normalizedQuery, $prefix]
            )
            ->whereRaw('LOWER(t.name) LIKE ?', [$contains]);

        return DB::query()
            ->fromSub($players->unionAll($teams), 'search_results')
            ->orderByDesc('match_priority')
            ->orderBy('label')
            ->limit($limit)
            ->get()
            ->all();
    }
}
