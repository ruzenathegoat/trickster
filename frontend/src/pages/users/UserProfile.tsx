import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from '../../lib/axios';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { User, Palette, Crosshair, Users, Trophy, Trash, FloppyDisk } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

export default function UserProfile() {
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    theme_color: user?.theme_color || '',
    favorite_role: user?.favorite_role || '',
  });
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'account' | 'favorites' | 'simulations'>('account');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/v1/user/profile?_t=${new Date().getTime()}`);
      setProfileData(response.data.user);
      setFormData(prev => ({
        ...prev,
        theme_color: response.data.user.theme_color || '',
        favorite_role: response.data.user.favorite_role || '',
      }));
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append('_method', 'PUT');
      payload.append('name', formData.name);
      payload.append('email', formData.email);
      if (formData.theme_color) payload.append('theme_color', formData.theme_color);
      if (formData.favorite_role) payload.append('favorite_role', formData.favorite_role);
      if (formData.password) payload.append('password', formData.password);
      if (photoFile) payload.append('profile_photo', photoFile);

      await axios.post('/api/v1/user/profile', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Profile updated successfully');
      setPhotoFile(null);
      setPhotoPreview(null);
      await checkAuth(); // Refresh global auth state to apply theme
      fetchProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removeFavoritePlayer = async (id: string) => {
    try {
      await axios.post(`/api/v1/user/favorites/players/${id}`);
      fetchProfile();
      toast.success('Player removed from favorites');
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const removeFavoriteTeam = async (id: string) => {
    try {
      await axios.post(`/api/v1/user/favorites/teams/${id}`);
      fetchProfile();
      toast.success('Team removed from favorites');
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  if (!profileData) {
    return (
      <div className="max-w-7xl pb-24 space-y-8">
        <Skeleton className="h-[200px] w-full border-4 border-black" />
        <Skeleton className="h-[400px] w-full border-4 border-black" />
      </div>
    );
  }

  const roleColors = {
    'Duelist': '#e74c3c',
    'Controller': '#9b59b6',
    'Initiator': '#f1c40f',
    'Sentinel': '#3498db'
  };

  return (
    <div className="max-w-7xl pb-24">
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black text-white p-6 md:p-12 border-4 border-black shadow-[8px_8px_0px_0px_var(--color-primary)] mb-12 relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
          <div className="w-24 h-24 md:w-40 md:h-40 bg-white border-4 border-black rounded-full overflow-hidden shrink-0 shadow-[4px_4px_0px_rgba(0,0,0,1)] relative z-20 flex items-center justify-center">
            {photoPreview || profileData.profile_photo_url ? (
              <img src={photoPreview || profileData.profile_photo_url} alt={profileData.name} className="w-full h-full object-cover" />
            ) : (
              <User size={64} weight="fill" className="text-gray-300 w-12 h-12 md:w-16 md:h-16" />
            )}
          </div>
          <div className="flex flex-col items-center md:items-start gap-3 md:gap-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display uppercase tracking-tighter text-center md:text-left break-words max-w-full">
              {profileData.name}
            </h1>
            <div className="flex gap-4">
              <span className="font-label text-sm uppercase tracking-widest bg-[var(--color-primary)] text-black px-3 py-1 font-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                {profileData.role || 'USER'}
              </span>
              {profileData.favorite_role && (
                <span className="font-label text-sm uppercase tracking-widest border-2 border-white bg-black px-3 py-1 font-bold shadow-[2px_2px_0px_rgba(255,255,255,1)]">
                  {profileData.favorite_role}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex flex-col md:flex-row flex-wrap gap-3 md:gap-4 mb-8 border-b-4 border-black pb-4">
        {[
          { id: 'account', label: 'Account & Preferences', icon: User },
          { id: 'favorites', label: 'Favorites', icon: Trophy },
          { id: 'simulations', label: 'Simulations', icon: FloppyDisk }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-center gap-3 w-full md:w-auto px-4 md:px-6 py-3 font-display uppercase tracking-widest text-base md:text-xl border-4 border-black transition-all ${
                activeTab === tab.id 
                  ? 'bg-black text-[var(--color-primary)] shadow-[4px_4px_0px_rgba(0,0,0,1)] translate-x-1 -translate-y-1' 
                  : 'bg-white text-black hover:bg-gray-100 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1'
              }`}
            >
              <Icon size={24} weight={activeTab === tab.id ? "fill" : "bold"} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="min-h-[400px]">
        {/* Tab 1: Account & Preferences */}
        {activeTab === 'account' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Account Form */}
            <div className="border-4 border-black p-6 bg-white shadow-[4px_4px_0px_0px_#111111]">
              <h2 className="text-2xl font-display uppercase tracking-tight border-b-4 border-black pb-4 mb-6 flex items-center gap-3">
                <User size={28} /> Account Info
              </h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block font-label text-[11px] font-black uppercase tracking-widest text-gray-500 mb-1">Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full border-2 border-black p-3 font-bold font-sans focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white text-black"
                  />
                </div>
                <div>
                  <label className="block font-label text-[11px] font-black uppercase tracking-widest text-gray-500 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full border-2 border-black p-3 font-bold font-sans focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white text-black"
                  />
                </div>
                <div>
                  <label className="block font-label text-[11px] font-black uppercase tracking-widest text-gray-500 mb-1">New Password (Optional)</label>
                  <input 
                    type="password" 
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full border-2 border-black p-3 font-bold font-sans focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white text-black"
                  />
                </div>
                <div>
                  <label className="block font-label text-[11px] font-black uppercase tracking-widest text-gray-500 mb-1">Profile Photo</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="w-full border-2 border-black p-2 font-bold font-sans text-sm file:mr-4 file:py-2 file:px-4 file:border-2 file:border-black file:text-sm file:font-black file:uppercase file:bg-[var(--color-primary)] file:text-black hover:file:bg-black hover:file:text-[var(--color-primary)] transition-colors cursor-pointer bg-white text-black"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-black text-white font-label font-black uppercase tracking-widest p-4 hover:bg-[var(--color-primary)] hover:text-black transition-colors border-2 border-black"
                  disabled={loading}
                >
                  Save Account Details
                </button>
              </form>
            </div>

            {/* Preferences Form */}
            <div className="border-4 border-black p-6 bg-white shadow-[4px_4px_0px_0px_#111111]">
              <h2 className="text-2xl font-display uppercase tracking-tight border-b-4 border-black pb-4 mb-6 flex items-center gap-3">
                <Palette size={28} /> Preferences
              </h2>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block font-label text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2">Theme Color</label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { label: 'Default Yellow', val: '#FFEB00' },
                      { label: 'Radiant Red', val: '#ff4655' },
                      { label: 'Viper Green', val: '#2ecc71' },
                      { label: 'Omen Purple', val: '#9b59b6' },
                      { label: 'Jett Blue', val: '#3498db' },
                      { label: 'Sova Cyan', val: '#00cec9' },
                    ].map(color => (
                      <button
                        key={color.val}
                        type="button"
                        onClick={() => setFormData({...formData, theme_color: color.val})}
                        className={`w-12 h-12 border-4 border-black transition-transform ${formData.theme_color === color.val || (!formData.theme_color && color.val === '#FFEB00') ? 'scale-110 shadow-[4px_4px_0px_0px_#111111] ring-2 ring-black ring-offset-2' : 'hover:scale-105'}`}
                        style={{ backgroundColor: color.val }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-label text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2">Favorite Role</label>
                  <select 
                    value={formData.favorite_role}
                    onChange={e => setFormData({...formData, favorite_role: e.target.value})}
                    className="w-full border-2 border-black p-3 font-bold font-sans focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white text-black"
                  >
                    <option value="">None</option>
                    <option value="Duelist">Duelist</option>
                    <option value="Initiator">Initiator</option>
                    <option value="Controller">Controller</option>
                    <option value="Sentinel">Sentinel</option>
                  </select>
                </div>
                <button 
                  type="submit" 
                  className="w-full border-4 border-black font-label font-black uppercase tracking-widest p-4 hover:bg-[var(--color-primary)] transition-colors mt-auto bg-white text-black"
                  disabled={loading}
                >
                  Apply Theme & Preferences
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Favorites */}
        {activeTab === 'favorites' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Favorite Players */}
            <div>
              <h2 className="text-2xl md:text-3xl font-display uppercase tracking-tight border-b-4 border-black pb-4 mb-6 flex items-center gap-3">
                <Crosshair size={32} /> Favorite Players
              </h2>
              {profileData.favorite_players && profileData.favorite_players.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {profileData.favorite_players.map((player: any) => (
                    <div key={player.id} className="border-4 border-black bg-white p-3 md:p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_#111111] gap-2">
                      <Link to={`/app/players/${player.id}`} className="flex items-center gap-3 md:gap-4 group min-w-0 flex-1">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 border-2 border-black overflow-hidden shrink-0">
                          {player.photo_url ? (
                            <img src={player.photo_url} alt={player.ign} className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-display text-xl md:text-2xl">?</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-lg md:text-2xl uppercase leading-none group-hover:text-[var(--color-primary)] transition-colors text-black truncate">{player.ign}</h3>
                          <p className="font-label text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 truncate">{player.team_name || 'F/A'}</p>
                        </div>
                      </Link>
                      <button 
                        onClick={() => removeFavoritePlayer(player.id)}
                        className="p-2 md:p-3 bg-white text-black hover:bg-black hover:text-[#ff3333] border-4 border-black transition-colors shrink-0"
                        title="Remove Favorite"
                      >
                        <Trash size={20} className="md:w-6 md:h-6" weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-4 border-dashed border-gray-300 p-8 text-center text-gray-400 font-label font-bold uppercase tracking-widest">
                  No favorite players yet.
                </div>
              )}
            </div>

            {/* Favorite Teams */}
            <div>
              <h2 className="text-2xl md:text-3xl font-display uppercase tracking-tight border-b-4 border-black pb-4 mb-6 flex items-center gap-3">
                <Users size={32} /> Favorite Teams
              </h2>
              {profileData.favorite_teams && profileData.favorite_teams.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {profileData.favorite_teams.map((team: any) => (
                    <div key={team.id} className="border-4 border-black bg-white p-3 md:p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_#111111] gap-2">
                      <Link to={`/app/teams/${team.id}`} className="flex items-center gap-3 md:gap-4 group min-w-0 flex-1">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-white border-2 border-black overflow-hidden flex items-center justify-center p-1 md:p-2 shrink-0">
                          {team.logo_url ? (
                            <img src={team.logo_url} alt={team.name} className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all" />
                          ) : (
                            <span className="font-display text-xl md:text-2xl">{team.acronym}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-lg md:text-2xl uppercase leading-none group-hover:text-[var(--color-primary)] transition-colors text-black truncate">{team.name}</h3>
                          <p className="font-label text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 truncate">{team.region}</p>
                        </div>
                      </Link>
                      <button 
                        onClick={() => removeFavoriteTeam(team.id)}
                        className="p-2 md:p-3 bg-white text-black hover:bg-black hover:text-[#ff3333] border-4 border-black transition-colors shrink-0"
                        title="Remove Favorite"
                      >
                        <Trash size={20} className="md:w-6 md:h-6" weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-4 border-dashed border-gray-300 p-8 text-center text-gray-400 font-label font-bold uppercase tracking-widest">
                  No favorite teams yet.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab 3: Simulations */}
        {activeTab === 'simulations' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl"
          >
            <h2 className="text-2xl md:text-3xl font-display uppercase tracking-tight border-b-4 border-black pb-4 mb-6 flex items-center gap-3">
              <FloppyDisk size={32} /> Saved Simulations
            </h2>
            {profileData.saved_simulations && profileData.saved_simulations.length > 0 ? (
              <div className="flex flex-col gap-4">
                {profileData.saved_simulations.map((sim: any) => (
                  <div key={sim.id} className="border-4 border-black bg-white p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between shadow-[4px_4px_0px_0px_#111111] md:shadow-[6px_6px_0px_0px_#111111] group gap-4">
                    <div className="min-w-0">
                      <h3 className="font-display text-xl md:text-3xl uppercase leading-none text-black truncate">{sim.name}</h3>
                      <p className="font-label text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-widest mt-2 truncate">
                        Saved: {new Date(sim.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="shrink-0 w-full md:w-auto">
                      <Link 
                        to="/app/simulation"
                        className="w-full md:w-auto bg-black text-white font-label text-xs md:text-sm font-black uppercase tracking-widest px-4 md:px-6 py-3 md:py-4 hover:bg-[var(--color-primary)] hover:text-black transition-colors border-4 border-transparent hover:border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center text-center"
                      >
                        Load Roster
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-4 border-dashed border-gray-300 p-12 text-center text-gray-400 font-label font-bold uppercase tracking-widest">
                No saved simulations yet. Build one in the simulator!
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
