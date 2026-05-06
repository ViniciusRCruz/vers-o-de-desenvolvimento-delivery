import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, MapPin, Search, LocateFixed, Plus, Trash2, Home } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { CITIES } from '../data/mockData';
import Logo from '../components/Logo';
import { validateCPF, formatCPF } from '../lib/utils';


// Fix icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapUpdater({ mapCenter }: { mapCenter: L.LatLng | null }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (mapCenter) {
      map.flyTo(mapCenter, 16);
    }
  }, [mapCenter, map]);
  return null;
}

function LocationMarker({ position, setPosition, setMapCenter }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void, setMapCenter: (pos: L.LatLng) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
    locationfound(e) {
      setPosition(e.latlng);
      setMapCenter(e.latlng);
      map.flyTo(e.latlng, 17);
    }
  });

  return (
    <>
      {position && <Marker position={position} />}
      <div className="absolute bottom-4 right-4 z-[400]">
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            map.locate({ setView: false, enableHighAccuracy: true });
          }}
          className="bg-white p-3 rounded-full shadow-lg border border-slate-100 text-slate-700 hover:text-blue-600 hover:bg-slate-50 focus:outline-none transition-colors flex items-center justify-center group"
          title="Minha localização atual"
        >
          <LocateFixed className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { isLoggedIn, currentUser, userProfile, selectedCity, setSelectedCity } = useAppContext();

  // Screen State
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [reference, setReference] = useState('');
  const [cityState, setCityState] = useState('');
  const [mapCenter, setMapCenter] = useState<L.LatLng | null>(null);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [formError, setFormError] = useState('');

  // Email Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isEmailLoginView, setIsEmailLoginView] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Step state for onboarding
  const [authStep, setAuthStep] = useState<'login' | 'cpf' | 'profile' | 'address' | 'password_suggest'>('login');

  // Initialize Data & Steps
  useEffect(() => {
    if (isLoggedIn) {
      if (userProfile) {
        if (userProfile.name) setName(userProfile.name);
        if (userProfile.email) setEmail(userProfile.email);
        if (userProfile.phone) setPhone(userProfile.phone);
        if (userProfile.cpf) setCpf(userProfile.cpf);

        if (!userProfile.cpf) {
          setAuthStep('cpf');
        } else if (!userProfile.name || !userProfile.phone) {
          setAuthStep('profile');
        } else if (!userProfile.addresses || userProfile.addresses.length === 0 || isAddingNew) {
          setAuthStep('address');
        } else {
          setAuthStep('profile'); // Default to profile if something is weird but normally handled by isLoggedIn check
        }
      } else if (currentUser) {
        if (currentUser.displayName) setName(currentUser.displayName);
        if (currentUser.email) setEmail(currentUser.email);
        setAuthStep('cpf'); // New user starts with CPF
      }
    } else {
      setAuthStep('login');
    }
  }, [isLoggedIn, userProfile, currentUser, isAddingNew]);

  const handleGoogleLogin = async () => {
    setLoginError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
         provider: 'google',
         options: {
            redirectTo: window.location.origin
         }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error(error);
      setLoginError(`Erro ao entrar: ${error.message}`);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Por favor, preencha e-mail e senha.');
      return;
    }

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({
          email: loginEmail,
          password: loginPassword,
        });
        if (error) throw error;
        // Supabase typically auto-logins after signup if confirmation is off
        // If confirmation is on, we might need a message. For now assume auto-login.
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error(error);
      setLoginError(`Erro na autenticação: ${error.message}`);
    }
  };

  const handleCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
        const data = await res.json();
        
        if (!data.errors) {
          setStreet(data.street || '');
          setCityState(`${data.city || ''} - ${data.state || ''}`);
          
          let lat, lng;
          // Tenta usar as coordenadas da BrasilAPI primeiro
          if (data.location && data.location.coordinates && data.location.coordinates.latitude) {
            lat = parseFloat(data.location.coordinates.latitude);
            lng = parseFloat(data.location.coordinates.longitude);
          } else if (data.street && data.city) {
            // Fallback para OpenStreetMap (Nominatim) se a BrasilAPI não devolver coordenadas
            try {
               const addressQuery = `${data.street}, ${data.city}, ${data.state}, Brasil`;
               const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addressQuery)}`);
               const geoData = await geoRes.json();
               if (geoData && geoData.length > 0) {
                  lat = parseFloat(geoData[0].lat);
                  lng = parseFloat(geoData[0].lon);
               }
            } catch(e) {
               console.error("Nominatim fallback error", e);
            }
          }

          if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
             const newPos = new L.LatLng(lat, lng);
             setPosition(newPos);
             setMapCenter(newPos);
          }
        }
      } catch (e) {
        console.error("BrasilAPI error", e);
      }
      setIsLoadingCep(false);
    }
  };

  const handleSaveCpf = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validateCPF(cpf)) {
      setFormError('CPF inválido. Por favor, verifique os números.');
      return;
    }
    setAuthStep('profile');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (password.length < 6) {
      setFormError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setAuthStep('address');
      setShowPasswordForm(false);
    } catch (error: any) {
      setFormError('Erro ao atualizar senha: ' + error.message);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // --- Validation ---
    if (!name.trim()) {
       setFormError('Por favor, informe seu nome completo.');
       return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
       setFormError('Por favor, informe um endereço de e-mail válido.');
       return;
    }
    
    if (!phone.replace(/\D/g, '').trim()) {
       setFormError('Por favor, informe seu telefone com DDD.');
       return;
    }

    if (!validateCPF(cpf)) {
       setFormError('CPF inválido.');
       return;
    }

    if (authStep === 'profile') {
       setAuthStep('password_suggest');
       return;
    }

    const hasAddresses = userProfile?.addresses && userProfile.addresses.length > 0;
    const shouldSaveAddress = !hasAddresses || isAddingNew;

    if (shouldSaveAddress) {
      if (!position || !street || !houseNumber) {
          setFormError('Por favor, preencha o seu endereço de entrega e selecione a posição no mapa.');
          return;
      }
    }
    
    if (!currentUser) return;
    
    try {
        let updatedAddresses = userProfile?.addresses || [];
        let activeAddressId = userProfile?.activeAddressId || '';

        if (shouldSaveAddress) {
          const addressId = `addr_${Date.now()}`;
          const newAddress = { 
              id: addressId, 
              cep, 
              street, 
              houseNumber, 
              reference, 
              cityState, 
              lat: position?.lat, 
              lng: position?.lng 
          };
          updatedAddresses = [...updatedAddresses, newAddress];
          activeAddressId = addressId;
        }
        
        const { error } = await supabase.from('user_profiles').upsert({
            id: currentUser.id,
            name,
            email,
            phone,
            cpf,
            addresses: updatedAddresses,
            activeAddressId: activeAddressId,
            updated_at: new Date().toISOString()
        });

        if (error) throw error;

        setIsAddingNew(false);
        navigate('/');
        window.location.reload(); 
    } catch (error: any) {
        console.error(error);
        setFormError('Erro ao salvar perfil: ' + error.message);
    }
  };

  const handleSelectAddress = async (addrId: string) => {
    if (!currentUser) return;
    try {
        const { error } = await supabase.from('user_profiles').update({
            activeAddressId: addrId,
            updated_at: new Date().toISOString()
        }).eq('id', currentUser.id);

        if (error) throw error;
        window.location.reload();
    } catch (error: any) {
        console.error(error);
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
      if(!currentUser || !userProfile) return;
      try {
          const remaining = userProfile.addresses.filter((a: any) => a.id !== addrId);
          // Auto select another if we deleted the active one
          let newActive = userProfile.activeAddressId;
          if(newActive === addrId) {
             newActive = remaining.length > 0 ? remaining[0].id : '';
          }

          const { error } = await supabase.from('user_profiles').update({
              addresses: remaining,
              activeAddressId: newActive,
              updated_at: new Date().toISOString()
          }).eq('id', currentUser.id);

          if (error) throw error;
          window.location.reload();
      } catch (error) {
          console.error(error);
      }
  }

  // --- RENDERING VIEWS ---

  if (isLoggedIn && userProfile && userProfile.cpf && !isAddingNew) {
    const addresses = userProfile.addresses || [];
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <header className="bg-white px-6 md:px-10 h-20 flex items-center border-b border-slate-200 sticky top-0 z-10 shadow-sm shadow-slate-100">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-[#003B5C] font-medium transition-colors">
            <ArrowLeft className="w-5 h-5" /> Início
            </button>
            <div className="mx-auto pr-10">
              <div className="flex items-center gap-1.5 leading-none">
                <Logo size="sm" showText={false} />
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-tighter text-[#003B5C]">PARNAÍBA</span>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-[#003B5C] uppercase">Delivery</span>
                </div>
              </div>
            </div>
        </header>

        <main className="flex-1 max-w-2xl w-full mx-auto p-6 md:p-10">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
               <h2 className="text-2xl font-bold text-slate-800">Minha Cidade</h2>
            </div>
            <div className="mb-8">
               <select 
                 className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-slate-700 outline-none focus:border-green-500 transition-all cursor-pointer shadow-sm"
                 value={selectedCity.id}
                 onChange={(e) => {
                    const city = CITIES.find(c => c.id === e.target.value);
                    if(city) setSelectedCity(city);
                 }}
               >
                 {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
            </div>

            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
               <h2 className="text-2xl font-bold text-slate-800">Meus Endereços</h2>
               <button onClick={() => { supabase.auth.signOut(); navigate('/'); }} className="text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                 Sair da Conta
               </button>
            </div>
            
            <div className="flex flex-col gap-4">
                {addresses.length === 0 && (
                    <div className="text-center py-6 text-slate-500">Nenhum endereço salvo.</div>
                )}
                {addresses.map((addr: any) => (
                    <div 
                        key={addr.id} 
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${userProfile.activeAddressId === addr.id ? 'border-green-600 bg-green-50/30' : 'border-slate-100 hover:border-green-200'}`}
                        onClick={() => handleSelectAddress(addr.id)}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${userProfile.activeAddressId === addr.id ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Home className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800">{addr.street}, {addr.houseNumber}</p>
                                    <p className="text-sm text-slate-500">{addr.cityState} • CEP: {addr.cep}</p>
                                    {addr.reference && <p className="text-xs text-slate-400 mt-1">Ref: {addr.reference}</p>}
                                    {userProfile.activeAddressId === addr.id ? (
                                        <span className="inline-block mt-2 text-xs font-bold uppercase tracking-wider text-green-700 bg-green-200/50 px-2.5 py-1 rounded-md">
                                            Endereço Principal
                                        </span>
                                    ) : (
                                        <button 
                                           onClick={(e) => { e.stopPropagation(); handleSelectAddress(addr.id); }}
                                           className="inline-block mt-2 text-xs font-bold text-slate-500 hover:text-green-600 hover:bg-slate-100 px-2.5 py-1 rounded-md transition-colors"
                                        >
                                           Tornar Principal
                                        </button>
                                    )}
                                </div>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }}
                                className="text-slate-400 hover:text-red-500 p-2"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button 
                onClick={() => setIsAddingNew(true)}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors"
            >
                <Plus className="w-5 h-5" /> Adicionar Novo Endereço
            </button>
          </div>
        </main>
      </div>
    );
  }

  // --- DEFAULT FORM ---

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white px-6 md:px-10 h-20 flex items-center border-b border-slate-200 sticky top-0 z-10 shadow-sm shadow-slate-100">
        <button 
          onClick={() => {
              if(isAddingNew && userProfile?.addresses?.length > 0) { setIsAddingNew(false); }
              else { navigate('/'); }
          }} 
          className="flex items-center gap-2 text-slate-500 hover:text-green-600 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Voltar
        </button>
        <div className="mx-auto pr-10">
          <div className="flex items-center gap-1.5 leading-none">
            <Logo size="sm" showText={false} />
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-[#003B5C]">PARNAÍBA</span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#003B5C] uppercase">Delivery</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-12">
          <div className="p-8 md:p-10">
            {authStep === 'login' ? (
              <div className="flex flex-col gap-6">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-slate-800">Bem-vindo(a)</h2>
                  <p className="text-slate-500 mt-2">Para sua segurança e praticidade, utilize o login seguro do Google.</p>
                </div>

                {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold p-4 rounded-xl text-center">
                    {loginError}
                  </div>
                )}
                
                <button 
                  onClick={handleGoogleLogin}
                  className="w-full bg-[#003B5C] text-white py-4 rounded-xl font-bold hover:bg-[#002B44] transition-colors shadow flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuar com Google
                </button>

                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-slate-100"></div>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">ou use seu e-mail</span>
                  <div className="flex-1 h-px bg-slate-100"></div>
                </div>

                {!isEmailLoginView ? (
                  <button 
                    onClick={() => setIsEmailLoginView(true)}
                    className="w-full bg-slate-50 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    Entrar com E-mail e Senha
                  </button>
                ) : (
                  <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <input 
                      type="email" 
                      placeholder="Seu E-mail" 
                      className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-[#003B5C] focus:ring-1 focus:ring-[#003B5C] transition-all font-medium"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                    />
                    <input 
                      type="password" 
                      placeholder="Sua Senha" 
                      className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-[#003B5C] focus:ring-1 focus:ring-[#003B5C] transition-all font-medium"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      className="w-full bg-[#003B5C] text-white py-4 rounded-xl font-bold hover:bg-[#002B44] transition-colors shadow"
                    >
                      {isRegistering ? 'Criar Conta' : 'Entrar'}
                    </button>
                    <div className="flex justify-between items-center px-1">
                      <button 
                        type="button"
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-xs font-bold text-[#003B5C] hover:underline"
                      >
                        {isRegistering ? 'Já tenho uma conta' : 'Ainda não tenho conta'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setIsEmailLoginView(false)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600"
                      >
                        Voltar
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-4 border-t border-slate-100 pt-6">
                   <h3 className="text-sm font-bold text-slate-500 mb-3 text-center uppercase tracking-wider">Onde você está?</h3>
                   <select 
                     className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-slate-700 outline-none focus:border-[#003B5C] transition-all cursor-pointer shadow-sm text-center"
                     value={selectedCity.id}
                     onChange={(e) => {
                        const city = CITIES.find(c => c.id === e.target.value);
                        if(city) setSelectedCity(city);
                     }}
                   >
                     {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
              </div>
            ) : authStep === 'cpf' ? (
              <form onSubmit={handleSaveCpf} className="flex flex-col gap-6">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-bold text-slate-800">Identificação</h2>
                  <p className="text-slate-500 mt-2 text-sm">O CPF é obrigatório para sua segurança e emissão de notas.</p>
                </div>
                
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold p-4 rounded-xl">
                    {formError}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <input 
                      type="tel" 
                      placeholder="000.000.000-00" 
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-[#003B5C] focus:ring-1 focus:ring-[#003B5C] transition-all font-bold text-lg text-center tracking-widest"
                      value={cpf}
                      onChange={e => setCpf(formatCPF(e.target.value))}
                      maxLength={14}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-[#003B5C] text-white py-4 rounded-xl font-bold hover:bg-[#002B44] transition-all shadow-md"
                >
                  Continuar
                </button>
              </form>
            ) : authStep === 'password_suggest' ? (
              <div className="flex flex-col gap-6">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-bold text-slate-800">Acesso Rápido</h2>
                  <p className="text-slate-500 mt-2 text-sm">Deseja criar uma senha para entrar sem o Google no futuro?</p>
                </div>

                {!showPasswordForm ? (
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => setShowPasswordForm(true)}
                      className="w-full bg-[#003B5C] text-white py-4 rounded-xl font-bold hover:bg-[#002B44] transition-all shadow-md"
                    >
                      Sim, criar uma senha
                    </button>
                    <button 
                      onClick={() => setAuthStep('address')}
                      className="w-full bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all"
                    >
                      Agora não, prefiro Google
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
                    {formError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold p-4 rounded-xl">
                        {formError}
                      </div>
                    )}
                    <input 
                      type="password" 
                      placeholder="Sua nova senha (mín. 6 dígitos)" 
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-[#003B5C] focus:ring-1 focus:ring-[#003B5C] transition-all font-medium"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-all shadow-md"
                    >
                      Salvar Senha e Continuar
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowPasswordForm(false)}
                      className="text-slate-400 text-sm font-bold hover:text-slate-600"
                    >
                      Voltar
                    </button>
                  </form>
                )}
              </div>
            ) : authStep === 'profile' ? (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-bold text-slate-800">Complete seu Perfil</h2>
                  <p className="text-slate-500 mt-2 text-sm">Quase lá! Só mais alguns detalhes.</p>
                </div>
                
                <div className="flex flex-col gap-4">
                  {formError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold p-4 rounded-xl">
                      {formError}
                    </div>
                  )}

                  <input 
                    type="text" 
                    placeholder="Seu Nome Completo" 
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-[#003B5C] focus:ring-1 focus:ring-[#003B5C] transition-all font-medium"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />

                  <input 
                    type="email" 
                    placeholder="Seu E-mail" 
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-[#003B5C] focus:ring-1 focus:ring-[#003B5C] transition-all font-medium"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />

                  <input 
                    type="tel" 
                    placeholder="Seu Telefone (WhatsApp)" 
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-[#003B5C] focus:ring-1 focus:ring-[#003B5C] transition-all font-medium"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                  
                  <div className="px-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    CPF: {cpf}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-[#003B5C] text-white py-4 rounded-xl font-bold hover:bg-[#002B44] transition-all shadow-md mt-2"
                >
                  Continuar
                </button>
              </form>
            ) : (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-bold text-slate-800">
                    {userProfile?.addresses?.length > 0 && !isAddingNew ? 'Confirmar Dados' : (isAddingNew ? 'Cadastrar Endereço' : 'Endereço de Entrega')}
                  </h2>
                  <p className="text-slate-500 mt-2 text-sm">
                    {userProfile?.addresses?.length > 0 && !isAddingNew ? 'Verifique se está tudo correto.' : 'Onde devemos entregar seu pedido?'}
                  </p>
                </div>
                
                <div className="flex flex-col gap-4">
                  {formError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold p-4 rounded-xl">
                      {formError}
                    </div>
                  )}

                  {(!userProfile?.addresses || userProfile.addresses.length === 0 || isAddingNew) ? (
                    <>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="CEP" 
                          className={`w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-[#003B5C] focus:ring-1 focus:ring-[#003B5C] transition-all font-medium ${isLoadingCep ? 'opacity-70' : ''}`}
                          value={cep}
                          onChange={e => setCep(e.target.value)}
                          onBlur={handleCepBlur}
                          maxLength={9}
                        />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      </div>

                      <div className="flex gap-3">
                        <input 
                          type="text" 
                          placeholder="Rua" 
                          className="w-2/3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-[#003B5C] focus:ring-1 focus:ring-[#003B5C] transition-all font-medium"
                          value={street}
                          onChange={e => setStreet(e.target.value)}
                        />
                        <input 
                          type="text" 
                          placeholder="Número" 
                          className="w-1/3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-[#003B5C] focus:ring-1 focus:ring-[#003B5C] transition-all font-medium"
                          value={houseNumber}
                          onChange={e => setHouseNumber(e.target.value)}
                        />
                      </div>
                      
                      <input 
                        type="text" 
                        placeholder="Ponto de Referência (Opcional)" 
                        className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-[#003B5C] focus:ring-1 focus:ring-[#003B5C] transition-all font-medium"
                        value={reference}
                        onChange={e => setReference(e.target.value)}
                      />

                      {cityState && (
                        <div className="px-1 text-sm font-semibold text-slate-500">
                          Cidade: <span className="text-slate-800">{cityState}</span>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-2 mt-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#003B5C]" /> Confirme no mapa a localização exata
                        </label>
                        <div className="h-56 rounded-xl overflow-hidden border border-slate-200 z-0 relative shadow-inner">
                          <MapContainer center={[-14.2350, -51.9253]} zoom={4} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                            <TileLayer 
                              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" 
                              attribution='Map data ©2024 Google'
                            />
                            <MapUpdater mapCenter={mapCenter} />
                            <LocationMarker position={position} setPosition={setPosition} setMapCenter={setMapCenter} />
                          </MapContainer>
                          {!position && (
                            <div className="absolute inset-0 bg-black/5 pointer-events-none flex items-center justify-center z-10">
                              <span className="bg-white/95 px-4 py-2 rounded-lg text-sm font-semibold shadow-md text-slate-700 tracking-tight">
                                Digite o CEP ou use o Alvo
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex flex-col gap-3">
                      <div className="flex items-center gap-3 text-[#003B5C]">
                        <Home className="w-6 h-6" />
                        <span className="font-bold text-lg">Endereço Principal</span>
                      </div>
                      <p className="text-slate-700 font-medium">
                        {userProfile.addresses.find((a: any) => a.id === userProfile.activeAddressId)?.street || userProfile.addresses[0].street}, 
                        {userProfile.addresses.find((a: any) => a.id === userProfile.activeAddressId)?.houseNumber || userProfile.addresses[0].houseNumber}
                      </p>
                      <p className="text-slate-500 text-sm">
                        {userProfile.addresses.find((a: any) => a.id === userProfile.activeAddressId)?.cityState || userProfile.addresses[0].cityState}
                      </p>
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-all shadow-md mt-2"
                >
                  {userProfile?.addresses?.length > 0 && !isAddingNew ? 'Concluir Cadastro' : 'Finalizar e Salvar'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
