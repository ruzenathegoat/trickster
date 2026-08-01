<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use App\Models\UserSavedSimulation;

class UserProfileController extends Controller
{
    public function getProfile(Request $request)
    {
        $userId = $request->user()->id;
        $cacheKey = 'api_user_profile_' . $userId;

        $data = Cache::remember($cacheKey, 3600, function() use ($request) {
            $user = $request->user()->load(['favoritePlayers.team', 'favoriteTeams', 'savedSimulations']);
            
            $favPlayers = $user->favoritePlayers->map(function ($player) {
                $arr = $player->toArray();
                $arr['team_name'] = $player->team ? $player->team->name : null;
                return $arr;
            })->values()->toArray();

            return [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'theme_color' => $user->theme_color,
                    'favorite_role' => $user->favorite_role,
                    'favorite_agent_id' => $user->favorite_agent_id,
                    'favorite_players' => $favPlayers,
                    'favorite_teams' => $user->favoriteTeams->toArray(),
                    'saved_simulations' => $user->savedSimulations->toArray(),
                    'profile_photo_url' => $user->profile_photo_url,
                ]
            ];
        });
        
        return response()->json($data);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8',
            'theme_color' => 'sometimes|nullable|string',
            'favorite_role' => 'sometimes|nullable|string',
            'favorite_agent_id' => 'sometimes|nullable|uuid',
            'profile_photo' => 'sometimes|nullable|image|max:2048',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        if ($request->hasFile('profile_photo')) {
            // Delete old photo if exists
            if ($user->profile_photo_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->profile_photo_path);
            }
            $path = $request->file('profile_photo')->store('profile-photos', 'public');
            $validated['profile_photo_path'] = $path;
        }

        $user->update($validated);
        
        Cache::forget('api_user_profile_' . $user->id);

        return response()->json(['message' => 'Profile updated successfully', 'user' => $user]);
    }

    public function toggleFavoritePlayer(Request $request, $playerId)
    {
        $user = $request->user();
        $user->favoritePlayers()->toggle($playerId);
        
        Cache::forget('api_user_profile_' . $user->id);

        return response()->json([
            'message' => 'Favorite player toggled',
            'favorites' => $user->favoritePlayers()->pluck('players.id')
        ]);
    }

    public function toggleFavoriteTeam(Request $request, $teamId)
    {
        $user = $request->user();
        $user->favoriteTeams()->toggle($teamId);
        
        Cache::forget('api_user_profile_' . $user->id);

        return response()->json([
            'message' => 'Favorite team toggled',
            'favorites' => $user->favoriteTeams()->pluck('teams.id')
        ]);
    }

    public function saveSimulation(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'map_id' => 'nullable|uuid',
            'team_data' => 'required|array',
        ]);

        $simulation = $request->user()->savedSimulations()->create($validated);
        
        Cache::forget('api_user_profile_' . $request->user()->id);

        return response()->json(['message' => 'Simulation saved', 'simulation' => $simulation], 201);
    }

    public function deleteSimulation(Request $request, $id)
    {
        $simulation = $request->user()->savedSimulations()->findOrFail($id);
        $simulation->delete();

        Cache::forget('api_user_profile_' . $request->user()->id);

        return response()->json(['message' => 'Simulation deleted']);
    }
}
