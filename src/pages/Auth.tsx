import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, MapPin, Search, LocateFixed, Plus, Trash2, Home } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { auth, db, googleProvider, handleFirestoreError } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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
  const { isLoggedIn, currentUser, userProfile } = useAppContext();

  // Screen State
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form State
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [phone, setPhone] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [reference, setReference] = useState('');
  const [cityState, setCityState] = useState('');
  const [mapCenter, setMapCenter] = useState<L.LatLng | null>(null);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Initialize Phone
  useEffect(() => {
    if (userProfile && userProfile.phone) {
      setPhone(userProfile.phone);
    }
  }, [userProfile]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
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
          
          if (data.location && data.location.coordinates) {
            const lat = parseFloat(data.location.coordinates.latitude);
            const lng = parseFloat(data.location.coordinates.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
              const newPos = new L.LatLng(lat, lng);
              setPosition(newPos);
              setMapCenter(newPos);
            }
          }
        }
      } catch (e) {
        console.error("BrasilAPI error", e);
      }
      setIsLoadingCep(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !position) return;
    
    try {
        const docRef = doc(db, 'users', currentUser.uid, 'private', 'info');
        const addressId = `addr_${Date.now()}`;
        const newAddress = { 
            id: addressId, 
            cep, 
            street, 
            houseNumber, 
            reference, 
            cityState, 
            lat: position.lat, 
            lng: position.lng 
        };
        
        let existingAddresses = [];
        if (userProfile && userProfile.addresses) {
            existingAddresses = [...userProfile.addresses];
        }

        const updatedAddresses = [...existingAddresses, newAddress];
        
        await setDoc(docRef, {
            name: currentUser.displayName || 'Usuário',
            phone,
            addresses: updatedAddresses,
            activeAddressId: addressId,
            updatedAt: serverTimestamp()
        }, { merge: true }); // Merge in case they just added an address

        setIsAddingNew(false);
        if(!userProfile) { // if the user just created the profile
            navigate('/');
        }
        window.location.reload(); 
    } catch (error) {
        handleFirestoreError(error, 'update', `/users/${currentUser.uid}/private/info`);
    }
  };

  const handleSelectAddress = async (addrId: string) => {
    if (!currentUser) return;
    try {
        const docRef = doc(db, 'users', currentUser.uid, 'private', 'info');
        await setDoc(docRef, {
            activeAddressId: addrId,
            updatedAt: serverTimestamp()
        }, { merge: true });
        window.location.reload();
    } catch (error) {
        handleFirestoreError(error, 'update', `/users/${currentUser.uid}/private/info`);
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
      if(!currentUser || !userProfile) return;
      try {
          const docRef = doc(db, 'users', currentUser.uid, 'private', 'info');
          const remaining = userProfile.addresses.filter((a: any) => a.id !== addrId);
          // Auto select another if we deleted the active one
          let newActive = userProfile.activeAddressId;
          if(newActive === addrId) {
             newActive = remaining.length > 0 ? remaining[0].id : '';
          }
          await setDoc(docRef, {
              addresses: remaining,
              activeAddressId: newActive,
              updatedAt: serverTimestamp()
          }, { merge: true });
          window.location.reload();
      } catch (error) {
          console.error(error);
      }
  }

  // --- RENDERING VIEWS ---

  if (isLoggedIn && userProfile && !isAddingNew) {
    const addresses = userProfile.addresses || [];
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <header className="bg-white px-6 md:px-10 h-20 flex items-center border-b border-slate-200 sticky top-0 z-10 shadow-sm shadow-slate-100">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-green-600 font-medium transition-colors">
            <ArrowLeft className="w-5 h-5" /> Início
            </button>
            <div className="mx-auto text-2xl font-extrabold text-green-600 tracking-tight pr-10">FRESHMERCADO</div>
        </header>

        <main className="flex-1 max-w-2xl w-full mx-auto p-6 md:p-10">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
               <h2 className="text-2xl font-bold text-slate-800">Meus Endereços</h2>
               <button onClick={() => { auth.signOut(); navigate('/'); }} className="text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
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
                                    {userProfile.activeAddressId === addr.id && (
                                        <span className="inline-block mt-2 text-xs font-bold uppercase tracking-wider text-green-700 bg-green-200/50 px-2.5 py-1 rounded-md">
                                            Endereço Principal
                                        </span>
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
        <div className="mx-auto text-2xl font-extrabold text-green-600 tracking-tight pr-10">
          FRESHMERCADO
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-12">
          <div className="p-8 md:p-10">
            {!isLoggedIn ? (
              <div className="flex flex-col gap-6">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-slate-800">Bem-vindo(a)</h2>
                  <p className="text-slate-500 mt-2">Para sua segurança e praticidade, utilize o login seguro do Google.</p>
                </div>
                
                <button 
                  onClick={handleGoogleLogin}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    <path d="M1 1h22v22H1z" fill="none"/>
                  </svg>
                  Continuar com Google
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-bold text-slate-800">{isAddingNew ? 'Cadastrar Endereço' : (userProfile && userProfile.addresses?.length > 0 ? 'Configurações de Perfil' : 'Complete seu Perfil')}</h2>
                  <p className="text-slate-500 mt-2 text-sm">Precisamos de suas informações de entrega.</p>
                </div>
                
                <div className="flex flex-col gap-4">
                  <input 
                    type="tel" 
                    placeholder="Seu Telefone (WhatsApp)" 
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                  />
                  
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="CEP" 
                      className={`w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium ${isLoadingCep ? 'opacity-70' : ''}`}
                      value={cep}
                      onChange={e => setCep(e.target.value)}
                      onBlur={handleCepBlur}
                      maxLength={9}
                      required
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>

                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Rua" 
                      className="w-2/3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Número" 
                      className="w-1/3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                      value={houseNumber}
                      onChange={e => setHouseNumber(e.target.value)}
                      required
                    />
                  </div>
                  
                  <input 
                    type="text" 
                    placeholder="Ponto de Referência (Opcional)" 
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
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
                      <MapPin className="w-4 h-4 text-green-500" /> Confirme no mapa a localização exata
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
                </div>

                <button 
                  type="submit" 
                  disabled={!position || !street || !houseNumber}
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-md"
                >
                  Salvar Endereço
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
