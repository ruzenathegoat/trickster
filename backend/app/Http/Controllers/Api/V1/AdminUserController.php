<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    private function getCacheKey() {
        $version = \Illuminate\Support\Facades\Cache::get('api_admin_users_version', 1);
        return 'api_admin_users_v' . $version;
    }

    private function invalidateCache() {
        \Illuminate\Support\Facades\Cache::put('api_admin_users_version', microtime(true));
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Get all users, ordered by created_at descending, cached to prevent N+1 and huge JSON payload serialization delays
        $users = \Illuminate\Support\Facades\Cache::remember($this->getCacheKey(), 3600, fn() => 
            User::orderBy('created_at', 'desc')->get()->toArray()
        );
        return response()->json($users);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => ['required', 'string', Rule::in(['admin', 'user'])],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);

        $this->invalidateCache();
        return response()->json($user, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = User::findOrFail($id);
        return response()->json($user);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'role' => ['sometimes', 'required', 'string', Rule::in(['admin', 'user'])],
        ]);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }
        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }
        if (isset($validated['role'])) {
            $user->role = $validated['role'];
        }
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        $this->invalidateCache();
        return response()->json($user);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = User::findOrFail($id);
        
        // Prevent users from deleting themselves
        if (auth()->id() === $user->id) {
            return response()->json(['message' => 'You cannot delete yourself.'], 403);
        }

        $user->delete();

        $this->invalidateCache();
        return response()->json(null, 204);
    }
}
